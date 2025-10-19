/**
 * @fileoverview Favorite routes configuration
 * @description Defines all routes for favorite-related operations
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-10-18
 */

import { Router } from 'express';
import { favoriteController } from '../controllers/favoriteController';
import { authenticate } from '../middleware/auth';

/**
 * @const favoriteRouter
 * @description Express router for favorite routes
 */
const favoriteRouter = Router();

/**
 * All favorite routes require authentication
 */

/**
 * @route GET /api/favorites/count
 * @description Get total number of favorites for the authenticated user
 * @access Private (requires authentication)
 */
favoriteRouter.get('/count', authenticate, favoriteController.getFavoriteCount.bind(favoriteController));

/**
 * @route GET /api/favorites/check/:movieId
 * @description Check if a movie is in user's favorites
 * @access Private (requires authentication)
 * @param {string} movieId - Movie ID to check
 */
favoriteRouter.get('/check/:movieId', authenticate, favoriteController.checkFavorite.bind(favoriteController));

/**
 * @route GET /api/favorites/movie/:movieId/count
 * @description Get how many users favorited a specific movie
 * @access Public
 * @param {string} movieId - Movie ID
 */
favoriteRouter.get('/movie/:movieId/count', favoriteController.getMovieFavoriteCount.bind(favoriteController));

/**
 * @route DELETE /api/favorites/clear
 * @description Remove all favorites for the authenticated user
 * @access Private (requires authentication)
 */
favoriteRouter.delete('/clear', authenticate, favoriteController.clearAllFavorites.bind(favoriteController));

/**
 * @route DELETE /api/favorites/:movieId
 * @description Remove a movie from user's favorites
 * @access Private (requires authentication)
 * @param {string} movieId - Movie ID to remove from favorites
 */
favoriteRouter.delete('/:movieId', authenticate, favoriteController.removeFavorite.bind(favoriteController));

/**
 * @route GET /api/favorites
 * @description Get user's favorite movies with pagination
 * @access Private (requires authentication)
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Results per page (default: 12, max: 100)
 */
favoriteRouter.get('/', authenticate, favoriteController.getFavorites.bind(favoriteController));

/**
 * @route POST /api/favorites
 * @description Add a movie to user's favorites
 * @access Private (requires authentication)
 * @body {string} movieId - Movie ID to add to favorites
 */
favoriteRouter.post('/', authenticate, favoriteController.addFavorite.bind(favoriteController));

export default favoriteRouter;
