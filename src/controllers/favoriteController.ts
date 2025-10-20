/**
 * @fileoverview Favorite controller for handling favorite-related requests
 * @description Handles all favorite CRUD operations
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-10-18
 */

import { Response, NextFunction } from 'express';
import { Favorite, IFavoriteDocument } from '../models/Favorite';
import { Movie } from '../models/Movie';
import { IAuthenticatedRequest, IApiResponse } from '../types';
import { createError } from '../middleware/errorHandler';
import { url } from 'inspector';

/**
 * @class FavoriteController
 * @description Controller class for favorite-related operations
 */
export class FavoriteController {
  /**
   * @method addFavorite
   * @description Add a movie to user's favorites
   * @route POST /api/favorites
   * @access Private (requires authentication)
   */
  public async addFavorite(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { movieId } = req.body;

      // Validate userId from token
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      // Validate movieId
      if (!movieId) {
        throw createError('Movie ID is required', 400);
      }

      // Validate ObjectId format
      if (!movieId.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      // Check if movie exists and is active
      const movie = await Movie.findOne({ _id: movieId, isActive: true });
      if (!movie) {
        throw createError('Movie not found', 404);
      }

      // Check if already favorited
      const existingFavorite = await Favorite.findOne({ userId, movieId });
      if (existingFavorite) {
        throw createError('Movie already in favorites', 409);
      }

      // Create favorite
      const favorite = new Favorite({
        userId,
        movieId,
      });

      await favorite.save();

      const response: IApiResponse = {
        success: true,
        message: 'Movie added to favorites successfully',
        data: {
          favoriteId: favorite._id,
          movieId: favorite.movieId,
          movieTitle: movie.title,
          addedAt: favorite.createdAt,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getFavorites
   * @description Get user's favorite movies with pagination
   * @route GET /api/favorites
   * @access Private (requires authentication)
   */
  public async getFavorites(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { page = 1, limit = 12 } = req.query as any;

      // Validate userId from token
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      // Parse pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      // Validate pagination
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw createError('Invalid pagination parameters', 400);
      }

      // Get favorites with movie data populated
      const [favorites, total] = await Promise.all([
        Favorite.find({ userId })
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
        Favorite.countDocuments({ userId }),
      ]);

      // Get movie details for each favorite
      const movieIds = favorites.map((fav) => fav.movieId);
      const movies = await Movie.find({ _id: { $in: movieIds }, isActive: true }).lean();

      // Create a map of movies for quick lookup
      const movieMap = new Map(movies.map((movie) => [movie._id.toString(), movie]));

      // Combine favorites with movie data
      const favoritesWithMovies = favorites
        .map((favorite) => {
          const movie = movieMap.get(favorite.movieId.toString());
          if (!movie) return null;

          return {
            favoriteId: favorite._id,
            addedAt: favorite.createdAt,
            movie: {
              id: movie._id,
              title: movie.title,
              description: movie.description,
              genre: movie.genre,
              url: movie.videoUrl,
              duration: movie.duration,
              releaseYear: movie.releaseYear,
              director: movie.director,
              poster: movie.poster,
              averageRating: movie.averageRating,
              totalRatings: movie.totalRatings,
              views: movie.views,
            },
          };
        })
        .filter((item) => item !== null);

      const totalPages = Math.ceil(total / limitNum);

      const response: IApiResponse = {
        success: true,
        message: `Retrieved ${favoritesWithMovies.length} favorite(s)`,
        data: {
          favorites: favoritesWithMovies,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalFavorites: total,
            favoritesPerPage: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method removeFavorite
   * @description Remove a movie from user's favorites
   * @route DELETE /api/favorites/:movieId
   * @access Private (requires authentication)
   */
  public async removeFavorite(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { movieId } = req.params;

      // Validate userId from token
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      // Validate ObjectId format
      if (!movieId.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      // Find and delete favorite
      const favorite = await Favorite.findOneAndDelete({
        userId,
        movieId,
      });

      if (!favorite) {
        throw createError('Favorite not found', 404);
      }

      const response: IApiResponse = {
        success: true,
        message: 'Movie removed from favorites successfully',
        data: {
          movieId: favorite.movieId,
          removedAt: new Date(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method checkFavorite
   * @description Check if a movie is in user's favorites
   * @route GET /api/favorites/check/:movieId
   * @access Private (requires authentication)
   */
  public async checkFavorite(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { movieId } = req.params;

      // Validate userId from token
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      // Validate ObjectId format
      if (!movieId.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      const isFavorite = await Favorite.checkFavorite(userId, movieId);

      const response: IApiResponse = {
        success: true,
        message: isFavorite ? 'Movie is in favorites' : 'Movie is not in favorites',
        data: {
          movieId,
          isFavorite,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getFavoriteCount
   * @description Get total number of favorites for the authenticated user
   * @route GET /api/favorites/count
   * @access Private (requires authentication)
   */
  public async getFavoriteCount(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;

      // Validate userId from token
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const count = await Favorite.getUserFavoritesCount(userId);

      const response: IApiResponse = {
        success: true,
        message: `User has ${count} favorite(s)`,
        data: {
          totalFavorites: count,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getMovieFavoriteCount
   * @description Get how many users favorited a specific movie
   * @route GET /api/favorites/movie/:movieId/count
   * @access Public
   */
  public async getMovieFavoriteCount(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { movieId } = req.params;

      // Validate ObjectId format
      if (!movieId.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      // Check if movie exists
      const movie = await Movie.findOne({ _id: movieId, isActive: true });
      if (!movie) {
        throw createError('Movie not found', 404);
      }

      const count = await Favorite.getFavoriteCount(movieId);

      const response: IApiResponse = {
        success: true,
        message: `Movie has been favorited ${count} time(s)`,
        data: {
          movieId,
          movieTitle: movie.title,
          favoriteCount: count,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method clearAllFavorites
   * @description Remove all favorites for the authenticated user
   * @route DELETE /api/favorites/clear
   * @access Private (requires authentication)
   */
  public async clearAllFavorites(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;

      // Validate userId from token
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      const result = await Favorite.deleteMany({ userId });

      const response: IApiResponse = {
        success: true,
        message: `Removed ${result.deletedCount} favorite(s)`,
        data: {
          deletedCount: result.deletedCount,
          clearedAt: new Date(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const favoriteController = new FavoriteController();
