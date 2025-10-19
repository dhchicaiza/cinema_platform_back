/**
 * @fileoverview Rating controller for handling rating-related requests
 * @description Handles all rating CRUD operations and statistics
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-10-18
 */

import { Response, NextFunction } from 'express';
import { Rating, IRatingDocument } from '../models/Rating';
import { Movie } from '../models/Movie';
import { IAuthenticatedRequest, IApiResponse } from '../types';
import { createError } from '../middleware/errorHandler';

/**
 * @class RatingController
 * @description Controller class for rating-related operations
 */
export class RatingController {
  /**
   * @method createRating
   * @description Create or update a rating for a movie
   * @route POST /api/ratings
   * @access Private (requires authentication)
   */
  public async createRating(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { movieId, rating } = req.body;

      // Validate userId from token
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      // Validate required fields
      if (!movieId || rating === undefined) {
        throw createError('Movie ID and rating are required', 400);
      }

      // Validate ObjectId format
      if (!movieId.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      // Validate rating value
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw createError('Rating must be an integer between 1 and 5', 400);
      }

      // Check if movie exists and is active
      const movie = await Movie.findOne({ _id: movieId, isActive: true });
      if (!movie) {
        throw createError('Movie not found', 404);
      }

      // Check if user already rated this movie
      const existingRating = await Rating.findOne({ userId, movieId });

      if (existingRating) {
        // Update existing rating
        existingRating.rating = rating;
        await existingRating.save();

        const response: IApiResponse = {
          success: true,
          message: 'Rating updated successfully',
          data: {
            ratingId: existingRating._id,
            movieId: existingRating.movieId,
            movieTitle: movie.title,
            rating: existingRating.rating,
            updatedAt: existingRating.updatedAt,
          },
        };

        res.status(200).json(response);
      } else {
        // Create new rating
        const newRating = new Rating({
          userId,
          movieId,
          rating,
        });

        await newRating.save();

        const response: IApiResponse = {
          success: true,
          message: 'Rating created successfully',
          data: {
            ratingId: newRating._id,
            movieId: newRating.movieId,
            movieTitle: movie.title,
            rating: newRating.rating,
            createdAt: newRating.createdAt,
          },
        };

        res.status(201).json(response);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getUserRatings
   * @description Get all ratings by the authenticated user
   * @route GET /api/ratings/user
   * @access Private (requires authentication)
   */
  public async getUserRatings(
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

      // Get ratings with movie data
      const [ratings, total] = await Promise.all([
        Rating.find({ userId })
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
        Rating.countDocuments({ userId }),
      ]);

      // Get movie details
      const movieIds = ratings.map((r) => r.movieId);
      const movies = await Movie.find({ _id: { $in: movieIds }, isActive: true }).lean();

      const movieMap = new Map(movies.map((m) => [m._id.toString(), m]));

      const ratingsWithMovies = ratings
        .map((rating) => {
          const movie = movieMap.get(rating.movieId.toString());
          if (!movie) return null;

          return {
            ratingId: rating._id,
            rating: rating.rating,
            createdAt: rating.createdAt,
            updatedAt: rating.updatedAt,
            movie: {
              id: movie._id,
              title: movie.title,
              poster: movie.poster,
              releaseYear: movie.releaseYear,
              genre: movie.genre,
              averageRating: movie.averageRating,
            },
          };
        })
        .filter((item) => item !== null);

      const totalPages = Math.ceil(total / limitNum);

      const response: IApiResponse = {
        success: true,
        message: `Retrieved ${ratingsWithMovies.length} rating(s)`,
        data: {
          ratings: ratingsWithMovies,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalRatings: total,
            ratingsPerPage: limitNum,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getMovieRatings
   * @description Get all ratings for a specific movie
   * @route GET /api/ratings/movie/:movieId
   * @access Public
   */
  public async getMovieRatings(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { movieId } = req.params;
      const { page = 1, limit = 12 } = req.query as any;

      // Validate ObjectId format
      if (!movieId.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      // Check if movie exists
      const movie = await Movie.findOne({ _id: movieId, isActive: true });
      if (!movie) {
        throw createError('Movie not found', 404);
      }

      // Parse pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      // Validate pagination
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw createError('Invalid pagination parameters', 400);
      }

      // Get ratings
      const [ratings, total, stats] = await Promise.all([
        Rating.find({ movieId })
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
        Rating.countDocuments({ movieId }),
        Rating.getMovieAverageRating(movieId),
      ]);

      // Calculate rating distribution
      const distribution = await Rating.aggregate([
        { $match: { movieId } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
      ]);

      const totalPages = Math.ceil(total / limitNum);

      const response: IApiResponse = {
        success: true,
        message: `Retrieved ${ratings.length} rating(s) for movie`,
        data: {
          movie: {
            id: movie._id,
            title: movie.title,
          },
          statistics: {
            averageRating: stats.average,
            totalRatings: stats.total,
            distribution: distribution.map((d) => ({
              stars: d._id,
              count: d.count,
              percentage: Math.round((d.count / stats.total) * 100),
            })),
          },
          ratings: ratings.map((r) => ({
            ratingId: r._id,
            rating: r.rating,
            userId: r.userId,
            createdAt: r.createdAt,
          })),
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalRatings: total,
            ratingsPerPage: limitNum,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getUserRatingForMovie
   * @description Get user's rating for a specific movie
   * @route GET /api/ratings/movie/:movieId/user
   * @access Private (requires authentication)
   */
  public async getUserRatingForMovie(
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

      const rating = await Rating.getUserRatingForMovie(userId, movieId);

      if (!rating) {
        const response: IApiResponse = {
          success: true,
          message: 'No rating found for this movie',
          data: {
            hasRating: false,
            rating: null,
          },
        };

        res.status(200).json(response);
        return;
      }

      const response: IApiResponse = {
        success: true,
        message: 'Rating retrieved successfully',
        data: {
          hasRating: true,
          ratingId: rating._id,
          rating: rating.rating,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method updateRating
   * @description Update user's rating for a movie
   * @route PUT /api/ratings/:movieId
   * @access Private (requires authentication)
   */
  public async updateRating(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { movieId } = req.params;
      const { rating } = req.body;

      // Validate userId from token
      if (!userId) {
        throw createError('User not authenticated', 401);
      }

      // Validate ObjectId format
      if (!movieId.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      // Validate rating value
      if (rating === undefined || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw createError('Rating must be an integer between 1 and 5', 400);
      }

      // Find and update rating
      const existingRating = await Rating.findOne({ userId, movieId });

      if (!existingRating) {
        throw createError('Rating not found', 404);
      }

      existingRating.rating = rating;
      await existingRating.save();

      const response: IApiResponse = {
        success: true,
        message: 'Rating updated successfully',
        data: {
          ratingId: existingRating._id,
          movieId: existingRating.movieId,
          rating: existingRating.rating,
          updatedAt: existingRating.updatedAt,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method deleteRating
   * @description Delete user's rating for a movie
   * @route DELETE /api/ratings/:movieId
   * @access Private (requires authentication)
   */
  public async deleteRating(
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

      // Find and delete rating
      const rating = await Rating.findOneAndDelete({ userId, movieId });

      if (!rating) {
        throw createError('Rating not found', 404);
      }

      const response: IApiResponse = {
        success: true,
        message: 'Rating deleted successfully',
        data: {
          movieId: rating.movieId,
          deletedAt: new Date(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getMovieStatistics
   * @description Get rating statistics for a movie
   * @route GET /api/ratings/movie/:movieId/stats
   * @access Public
   */
  public async getMovieStatistics(
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

      const stats = await Rating.getMovieAverageRating(movieId);

      // Get rating distribution
      const distribution = await Rating.aggregate([
        { $match: { movieId } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
      ]);

      const response: IApiResponse = {
        success: true,
        message: 'Movie rating statistics retrieved successfully',
        data: {
          movieId: movie._id,
          movieTitle: movie.title,
          statistics: {
            averageRating: stats.average,
            totalRatings: stats.total,
            distribution: distribution.map((d) => ({
              stars: d._id,
              count: d.count,
              percentage: stats.total > 0 ? Math.round((d.count / stats.total) * 100) : 0,
            })),
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const ratingController = new RatingController();
