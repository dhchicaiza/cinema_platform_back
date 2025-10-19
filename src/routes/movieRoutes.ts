/**
 * @fileoverview Movie routes configuration
 * @description Defines all routes for movie-related operations
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-10-18
 */

import { Router } from 'express';
import { movieController } from '../controllers/movieController';
import { authenticate } from '../middleware/auth';

/**
 * @const movieRouter
 * @description Express router for movie routes
 */
const movieRouter = Router();

/**
 * @route GET /api/movies/genres
 * @description Get all available genres with movie counts
 * @access Public
 */
movieRouter.get('/genres', movieController.getAvailableGenres.bind(movieController));

/**
 * @route GET /api/movies/popular
 * @description Get most viewed movies
 * @access Public
 * @query {number} limit - Number of movies to return (default: 10, max: 50)
 */
movieRouter.get('/popular', movieController.getPopularMovies.bind(movieController));

/**
 * @route GET /api/movies/top-rated
 * @description Get top-rated movies
 * @access Public
 * @query {number} limit - Number of movies to return (default: 10, max: 50)
 */
movieRouter.get('/top-rated', movieController.getTopRatedMovies.bind(movieController));

/**
 * @route GET /api/movies/recent
 * @description Get recently added movies
 * @access Public
 * @query {number} limit - Number of movies to return (default: 10, max: 50)
 */
movieRouter.get('/recent', movieController.getRecentMovies.bind(movieController));

/**
 * @route GET /api/movies/search
 * @description Search movies by title, description, director, or cast
 * @access Public
 * @query {string} q - Search query (minimum 2 characters)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Results per page (default: 12, max: 100)
 */
movieRouter.get('/search', movieController.searchMovies.bind(movieController));

/**
 * @route GET /api/movies/genre/:genre
 * @description Get movies by genre (supports comma-separated genres)
 * @access Public
 * @param {string} genre - Genre name or comma-separated genres
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Results per page (default: 12, max: 100)
 */
movieRouter.get('/genre/:genre', movieController.getMoviesByGenre.bind(movieController));

/**
 * @route GET /api/movies/:id/stats
 * @description Get statistics for a specific movie
 * @access Public
 * @param {string} id - Movie ID
 */
movieRouter.get('/:id/stats', movieController.getMovieStatistics.bind(movieController));

/**
 * @route POST /api/movies/:id/view
 * @description Increment view counter for a movie
 * @access Public
 * @param {string} id - Movie ID
 */
movieRouter.post('/:id/view', movieController.incrementMovieViews.bind(movieController));

/**
 * @route GET /api/movies/:id
 * @description Get a single movie by ID
 * @access Public
 * @param {string} id - Movie ID
 */
movieRouter.get('/:id', movieController.getMovieById.bind(movieController));

/**
 * @route GET /api/movies
 * @description Get all movies with pagination and filters
 * @access Public
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Results per page (default: 12, max: 100)
 * @query {string} genre - Filter by genre
 * @query {number} minRating - Minimum average rating (0-5)
 * @query {string} sortBy - Sort field (title, createdAt, averageRating, views, releaseYear)
 * @query {string} sortOrder - Sort order (asc, desc)
 */
movieRouter.get('/', movieController.getAllMovies.bind(movieController));

/**
 * @route POST /api/movies
 * @description Create a new movie (ADMIN only - future implementation)
 * @access Private/Admin
 * @body {object} movieData - Movie information
 */
movieRouter.post('/', movieController.createMovie.bind(movieController));

/**
 * @route PUT /api/movies/:id
 * @description Update an existing movie (ADMIN only - future implementation)
 * @access Private/Admin
 * @param {string} id - Movie ID
 * @body {object} updateData - Updated movie information
 */
movieRouter.put('/:id', movieController.updateMovie.bind(movieController));

/**
 * @route DELETE /api/movies/:id
 * @description Soft delete a movie (ADMIN only - future implementation)
 * @access Private/Admin
 * @param {string} id - Movie ID
 */
movieRouter.delete('/:id', movieController.deleteMovie.bind(movieController));

export default movieRouter;
