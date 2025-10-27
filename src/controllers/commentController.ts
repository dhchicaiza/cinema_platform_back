/**
 * @fileoverview Comment Controller - Handles all comment-related operations
 * @description Controller for managing movie comments (create, read, update, delete)
 * @module controllers/commentController
 * @version 1.0.0
 * @since 1.0.0
 */

import { Response, NextFunction } from 'express';
import Comment, { ICommentDocument } from '@/models/Comment';
import Movie from '@/models/Movie';
import { IAuthenticatedRequest } from '@/types';
import { createError } from '@/middleware/errorHandler';

/**
 * @class CommentController
 * @description Handles all comment operations with proper error handling
 */
class CommentController {
  private static instance: CommentController;

  /**
   * @method getInstance
   * @description Returns singleton instance of CommentController
   * @returns {CommentController} Singleton instance
   * @static
   */
  public static getInstance(): CommentController {
    if (!CommentController.instance) {
      CommentController.instance = new CommentController();
    }
    return CommentController.instance;
  }

  /**
   * @method createComment
   * @description Create a new comment on a movie
   * @route POST /api/comments/:movieId
   * @access Protected
   * @param {IAuthenticatedRequest} req - Express request with authenticated user
   * @param {Response} res - Express response
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public createComment = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { movieId } = req.params;
      const { content } = req.body;
      const userId = req.user?.userId;

      // Validate required fields
      if (!content || content.trim().length === 0) {
        throw createError('Comment content is required', 400);
      }

      if (!userId) {
        throw createError('Authentication required', 401);
      }

      // Verify movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) {
        throw createError('Movie not found', 404);
      }

      // Create comment
      const comment = await Comment.create({
        userId,
        movieId,
        content: content.trim(),
        edited: false,
      });

      // Populate user data
      await comment.populate('userId', 'firstName lastName avatar');

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @method getMovieComments
   * @description Get all comments for a specific movie
   * @route GET /api/comments/movie/:movieId
   * @access Public
   * @param {IAuthenticatedRequest} req - Express request
   * @param {Response} res - Express response
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public getMovieComments = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { movieId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Verify movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) {
        throw createError('Movie not found', 404);
      }

      // Get paginated comments
      const result = await Comment.getMovieComments(movieId, page, limit);

      res.status(200).json({
        success: true,
        message: 'Comments retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @method getUserComments
   * @description Get all comments by the authenticated user
   * @route GET /api/comments/user
   * @access Protected
   * @param {IAuthenticatedRequest} req - Express request with authenticated user
   * @param {Response} res - Express response
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public getUserComments = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        throw createError('Authentication required', 401);
      }

      // Get paginated comments
      const result = await Comment.getUserComments(userId, page, limit);

      res.status(200).json({
        success: true,
        message: 'User comments retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @method updateComment
   * @description Update a comment (only by the comment author)
   * @route PUT /api/comments/:commentId
   * @access Protected
   * @param {IAuthenticatedRequest} req - Express request with authenticated user
   * @param {Response} res - Express response
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public updateComment = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user?.userId;

      // Validate required fields
      if (!content || content.trim().length === 0) {
        throw createError('Comment content is required', 400);
      }

      if (!userId) {
        throw createError('Authentication required', 401);
      }

      // Find comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw createError('Comment not found', 404);
      }

      // Verify ownership
      if (comment.userId.toString() !== userId) {
        throw createError('You can only edit your own comments', 403);
      }

      // Update comment
      comment.content = content.trim();
      comment.edited = true;
      await comment.save();

      // Populate user data
      await comment.populate('userId', 'firstName lastName avatar');

      res.status(200).json({
        success: true,
        message: 'Comment updated successfully',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @method deleteComment
   * @description Delete a comment (only by the comment author)
   * @route DELETE /api/comments/:commentId
   * @access Protected
   * @param {IAuthenticatedRequest} req - Express request with authenticated user
   * @param {Response} res - Express response
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public deleteComment = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { commentId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw createError('Authentication required', 401);
      }

      // Find comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw createError('Comment not found', 404);
      }

      // Verify ownership
      if (comment.userId.toString() !== userId) {
        throw createError('You can only delete your own comments', 403);
      }

      // Delete comment
      await Comment.findByIdAndDelete(commentId);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @method getCommentById
   * @description Get a single comment by ID
   * @route GET /api/comments/:commentId
   * @access Public
   * @param {IAuthenticatedRequest} req - Express request
   * @param {Response} res - Express response
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public getCommentById = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { commentId } = req.params;

      // Find comment
      const comment = await Comment.findById(commentId)
        .populate('userId', 'firstName lastName avatar')
        .populate('movieId', 'title poster');

      if (!comment) {
        throw createError('Comment not found', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Comment retrieved successfully',
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @method getCommentCount
   * @description Get total comment count for a movie
   * @route GET /api/comments/movie/:movieId/count
   * @access Public
   * @param {IAuthenticatedRequest} req - Express request
   * @param {Response} res - Express response
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public getCommentCount = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { movieId } = req.params;

      // Verify movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) {
        throw createError('Movie not found', 404);
      }

      // Count comments
      const count = await Comment.countDocuments({ movieId });

      res.status(200).json({
        success: true,
        message: 'Comment count retrieved successfully',
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default CommentController.getInstance();
