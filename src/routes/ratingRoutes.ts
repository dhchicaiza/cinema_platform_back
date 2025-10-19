/**
 * @fileoverview Rating routes configuration
 * @description Defines all routes for rating-related operations
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-10-18
 */

import { Router } from 'express';
import { ratingController } from '../controllers/ratingController';
import { authenticate } from '../middleware/auth';

/**
 * @const ratingRouter
 * @description Express router for rating routes
 */
const ratingRouter = Router();

/**
 * @route GET /api/ratings/user
 * @description Get all ratings by the authenticated user
 * @access Private (requires authentication)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Results per page (default: 12, max: 100)
 */
ratingRouter.get('/user', authenticate, ratingController.getUserRatings.bind(ratingController));

/**
 * @route GET /api/ratings/movie/:movieId/stats
 * @description Get rating statistics for a specific movie
 * @access Public
 * @param {string} movieId - Movie ID
 */
ratingRouter.get('/movie/:movieId/stats', ratingController.getMovieStatistics.bind(ratingController));

/**
 * @route GET /api/ratings/movie/:movieId/user
 * @description Get authenticated user's rating for a specific movie
 * @access Private (requires authentication)
 * @param {string} movieId - Movie ID
 */
ratingRouter.get('/movie/:movieId/user', authenticate, ratingController.getUserRatingForMovie.bind(ratingController));

/**
 * @route GET /api/ratings/movie/:movieId
 * @description Get all ratings for a specific movie with pagination
 * @access Public
 * @param {string} movieId - Movie ID
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Results per page (default: 12, max: 100)
 */
ratingRouter.get('/movie/:movieId', ratingController.getMovieRatings.bind(ratingController));

/**
 * @route PUT /api/ratings/:movieId
 * @description Update user's rating for a movie
 * @access Private (requires authentication)
 * @param {string} movieId - Movie ID
 * @body {number} rating - New rating value (1-5)
 */
ratingRouter.put('/:movieId', authenticate, ratingController.updateRating.bind(ratingController));

/**
 * @route DELETE /api/ratings/:movieId
 * @description Delete user's rating for a movie
 * @access Private (requires authentication)
 * @param {string} movieId - Movie ID
 */
ratingRouter.delete('/:movieId', authenticate, ratingController.deleteRating.bind(ratingController));

/**
 * @route POST /api/ratings
 * @description Create or update a rating for a movie
 * @access Private (requires authentication)
 * @body {string} movieId - Movie ID to rate
 * @body {number} rating - Rating value (1-5 stars)
 */
ratingRouter.post('/', authenticate, ratingController.createRating.bind(ratingController));

export default ratingRouter;
