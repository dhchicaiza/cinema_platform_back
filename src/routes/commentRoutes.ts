/**
 * @fileoverview Comment Routes - Express routes for comment operations
 * @description Defines all routes for comment management
 * @module routes/commentRoutes
 * @version 1.0.0
 * @since 1.0.0
 */

import { Router } from 'express';
import commentController from '@/controllers/commentController';
import { authenticate } from '@/middleware/auth';

/**
 * @const router
 * @description Express router for comment routes
 * @type {Router}
 */
const router = Router();

/**
 * @route POST /api/comments/:movieId
 * @description Create a new comment on a movie
 * @access Protected
 * @param {string} movieId - Movie ID
 * @body {string} content - Comment content (1-1000 characters)
 * @returns {IApiResponse<IComment>} Created comment
 */
router.post('/:movieId', authenticate, commentController.createComment);

/**
 * @route GET /api/comments/movie/:movieId
 * @description Get all comments for a specific movie
 * @access Public
 * @param {string} movieId - Movie ID
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Comments per page (default: 20)
 * @returns {IApiResponse<{comments: IComment[], total: number, page: number, pages: number}>}
 */
router.get('/movie/:movieId', commentController.getMovieComments);

/**
 * @route GET /api/comments/movie/:movieId/count
 * @description Get total comment count for a movie
 * @access Public
 * @param {string} movieId - Movie ID
 * @returns {IApiResponse<{count: number}>}
 */
router.get('/movie/:movieId/count', commentController.getCommentCount);

/**
 * @route GET /api/comments/user
 * @description Get all comments by the authenticated user
 * @access Protected
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Comments per page (default: 20)
 * @returns {IApiResponse<{comments: IComment[], total: number, page: number, pages: number}>}
 */
router.get('/user', authenticate, commentController.getUserComments);

/**
 * @route GET /api/comments/:commentId
 * @description Get a single comment by ID
 * @access Public
 * @param {string} commentId - Comment ID
 * @returns {IApiResponse<IComment>}
 */
router.get('/:commentId', commentController.getCommentById);

/**
 * @route PUT /api/comments/:commentId
 * @description Update a comment (only by the comment author)
 * @access Protected
 * @param {string} commentId - Comment ID
 * @body {string} content - Updated comment content (1-1000 characters)
 * @returns {IApiResponse<IComment>} Updated comment
 */
router.put('/:commentId', authenticate, commentController.updateComment);

/**
 * @route DELETE /api/comments/:commentId
 * @description Delete a comment (only by the comment author)
 * @access Protected
 * @param {string} commentId - Comment ID
 * @returns {IApiResponse<null>}
 */
router.delete('/:commentId', authenticate, commentController.deleteComment);

export default router;
