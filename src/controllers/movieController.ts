/**
 * @fileoverview Movie controller for handling movie-related requests
 * @description Handles all movie CRUD operations, search, filtering, and statistics
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-10-18
 */

import { Response, NextFunction } from 'express';
import { Movie, IMovieDocument } from '../models/Movie';
import { IAuthenticatedRequest, IApiResponse, IMovieQuery, MovieGenre } from '../types';
import { createError } from '../middleware/errorHandler';

/**
 * @class MovieController
 * @description Controller class for movie-related operations
 */
export class MovieController {
  /**
   * @method getAllMovies
   * @description Get all movies with pagination and optional filters
   * @route GET /api/movies
   * @access Public
   */
  public async getAllMovies(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        page = 1,
        limit = 12,
        genre,
        minRating,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as any;

      // Parse pagination parameters
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      // Validate pagination
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw createError('Invalid pagination parameters', 400);
      }

      // Build query
      const query: any = { isActive: true };

      // Apply genre filter
      if (genre) {
        const genres = Array.isArray(genre) ? genre : [genre];
        query.genre = { $in: genres };
      }

      // Apply rating filter
      if (minRating) {
        const minRatingNum = parseFloat(minRating as string);
        if (minRatingNum >= 0 && minRatingNum <= 5) {
          query.averageRating = { $gte: minRatingNum };
        }
      }

      // Build sort object
      const sortOptions: any = {};
      const validSortFields = ['title', 'createdAt', 'averageRating', 'views', 'releaseYear'];

      if (validSortFields.includes(sortBy as string)) {
        sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
      } else {
        sortOptions.createdAt = -1; // Default sort
      }

      // Execute query with pagination
      const [movies, total] = await Promise.all([
        Movie.find(query)
          .sort(sortOptions)
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
        Movie.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      const response: IApiResponse = {
        success: true,
        message: `Retrieved ${movies.length} movie(s)`,
        data: {
          movies,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalMovies: total,
            moviesPerPage: limitNum,
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
   * @method getMovieById
   * @description Get a single movie by ID
   * @route GET /api/movies/:id
   * @access Public
   */
  public async getMovieById(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      const movie = await Movie.findOne({ _id: id, isActive: true });

      if (!movie) {
        throw createError('Movie not found', 404);
      }

      const response: IApiResponse = {
        success: true,
        message: 'Movie retrieved successfully',
        data: movie,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method searchMovies
   * @description Search movies by title or description
   * @route GET /api/movies/search
   * @access Public
   */
  public async searchMovies(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { q, page = 1, limit = 12 } = req.query as any;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        throw createError('Search query must be at least 2 characters', 400);
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      // Validate pagination
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw createError('Invalid pagination parameters', 400);
      }

      // Search using text index or regex
      const searchRegex = new RegExp(q.trim(), 'i');
      const query = {
        isActive: true,
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { director: searchRegex },
          { cast: searchRegex },
        ],
      };

      const [movies, total] = await Promise.all([
        Movie.find(query)
          .sort({ averageRating: -1, views: -1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
        Movie.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      const response: IApiResponse = {
        success: true,
        message: `Found ${total} movie(s) matching "${q}"`,
        data: {
          query: q,
          movies,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalResults: total,
            resultsPerPage: limitNum,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getMoviesByGenre
   * @description Get movies filtered by genre(s)
   * @route GET /api/movies/genre/:genre
   * @access Public
   */
  public async getMoviesByGenre(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { genre } = req.params;
      const { page = 1, limit = 12 } = req.query as any;

      if (!genre) {
        throw createError('Genre parameter is required', 400);
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      // Validate pagination
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw createError('Invalid pagination parameters', 400);
      }

      // Split multiple genres if provided (comma-separated)
      const genres = genre.split(',').map((g) => g.trim());

      const query = {
        isActive: true,
        genre: { $in: genres },
      };

      const [movies, total] = await Promise.all([
        Movie.find(query)
          .sort({ averageRating: -1, title: 1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean(),
        Movie.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      const response: IApiResponse = {
        success: true,
        message: `Found ${total} ${genre} movie(s)`,
        data: {
          genre: genres,
          movies,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalMovies: total,
            moviesPerPage: limitNum,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getPopularMovies
   * @description Get most viewed movies
   * @route GET /api/movies/popular
   * @access Public
   */
  public async getPopularMovies(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { limit = 10 } = req.query as any;

      const limitNum = parseInt(limit as string, 10);

      // Validate limit
      if (limitNum < 1 || limitNum > 50) {
        throw createError('Limit must be between 1 and 50', 400);
      }

      const movies = await Movie.getMostPopular(limitNum);

      const response: IApiResponse = {
        success: true,
        message: `Retrieved ${movies.length} popular movie(s)`,
        data: {
          movies,
          count: movies.length,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getTopRatedMovies
   * @description Get top-rated movies
   * @route GET /api/movies/top-rated
   * @access Public
   */
  public async getTopRatedMovies(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { limit = 10 } = req.query as any;

      const limitNum = parseInt(limit as string, 10);

      // Validate limit
      if (limitNum < 1 || limitNum > 50) {
        throw createError('Limit must be between 1 and 50', 400);
      }

      const movies = await Movie.getTopRated(limitNum);

      const response: IApiResponse = {
        success: true,
        message: `Retrieved ${movies.length} top-rated movie(s)`,
        data: {
          movies,
          count: movies.length,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getRecentMovies
   * @description Get recently added movies
   * @route GET /api/movies/recent
   * @access Public
   */
  public async getRecentMovies(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { limit = 10 } = req.query as any;

      const limitNum = parseInt(limit as string, 10);

      // Validate limit
      if (limitNum < 1 || limitNum > 50) {
        throw createError('Limit must be between 1 and 50', 400);
      }

      const movies = await Movie.getRecentlyAdded(limitNum);

      const response: IApiResponse = {
        success: true,
        message: `Retrieved ${movies.length} recent movie(s)`,
        data: {
          movies,
          count: movies.length,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method incrementMovieViews
   * @description Increment view counter for a movie
   * @route POST /api/movies/:id/view
   * @access Public (but could be protected if needed)
   */
  public async incrementMovieViews(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      const movie = await Movie.findOne({ _id: id, isActive: true });

      if (!movie) {
        throw createError('Movie not found', 404);
      }

      // Increment views
      await movie.incrementViews();

      const response: IApiResponse = {
        success: true,
        message: 'Movie view recorded successfully',
        data: {
          movieId: movie._id,
          views: movie.views,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getMovieStatistics
   * @description Get statistics for a specific movie
   * @route GET /api/movies/:id/stats
   * @access Public
   */
  public async getMovieStatistics(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      const movie = await Movie.findOne({ _id: id, isActive: true });

      if (!movie) {
        throw createError('Movie not found', 404);
      }

      const response: IApiResponse = {
        success: true,
        message: 'Movie statistics retrieved successfully',
        data: {
          movieId: movie._id,
          title: movie.title,
          statistics: {
            views: movie.views || 0,
            averageRating: movie.averageRating || 0,
            totalRatings: movie.totalRatings || 0,
            duration: movie.duration,
            formattedDuration: movie.getFormattedDuration(),
            releaseYear: movie.releaseYear,
            genres: movie.genre,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getAvailableGenres
   * @description Get list of all available genres with movie counts
   * @route GET /api/movies/genres
   * @access Public
   */
  public async getAvailableGenres(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Aggregate to get genre counts
      const genreCounts = await Movie.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$genre' },
        {
          $group: {
            _id: '$genre',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      const genres = genreCounts.map((item) => ({
        genre: item._id,
        movieCount: item.count,
      }));

      const response: IApiResponse = {
        success: true,
        message: `Retrieved ${genres.length} genre(s)`,
        data: {
          genres,
          totalGenres: genres.length,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method createMovie
   * @description Create a new movie (ADMIN only - future implementation)
   * @route POST /api/movies
   * @access Private/Admin
   */
  public async createMovie(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const movieData = req.body;

      // Validate required fields
      const requiredFields = ['title', 'description', 'genre', 'duration', 'releaseYear', 'poster', 'videoUrl'];
      const missingFields = requiredFields.filter((field) => !movieData[field]);

      if (missingFields.length > 0) {
        throw createError(
          `Missing required fields: ${missingFields.join(', ')}`,
          400
        );
      }

      // Create new movie
      const movie = new Movie(movieData);
      await movie.save();

      const response: IApiResponse = {
        success: true,
        message: 'Movie created successfully',
        data: movie,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method updateMovie
   * @description Update an existing movie (ADMIN only - future implementation)
   * @route PUT /api/movies/:id
   * @access Private/Admin
   */
  public async updateMovie(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate ObjectId format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      // Don't allow updating certain fields
      delete updateData.averageRating;
      delete updateData.totalRatings;
      delete updateData.views;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const movie = await Movie.findOneAndUpdate(
        { _id: id, isActive: true },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!movie) {
        throw createError('Movie not found', 404);
      }

      const response: IApiResponse = {
        success: true,
        message: 'Movie updated successfully',
        data: movie,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method deleteMovie
   * @description Soft delete a movie (ADMIN only - future implementation)
   * @route DELETE /api/movies/:id
   * @access Private/Admin
   */
  public async deleteMovie(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Validate ObjectId format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid movie ID format', 400);
      }

      // Soft delete by setting isActive to false
      const movie = await Movie.findOneAndUpdate(
        { _id: id, isActive: true },
        { $set: { isActive: false } },
        { new: true }
      );

      if (!movie) {
        throw createError('Movie not found', 404);
      }

      const response: IApiResponse = {
        success: true,
        message: 'Movie deleted successfully',
        data: {
          movieId: id,
          deletedAt: new Date(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const movieController = new MovieController();
