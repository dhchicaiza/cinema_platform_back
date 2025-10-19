/**
 * @fileoverview Upload controller for handling file uploads
 * @description Controller for uploading images and videos to Cloudinary
 * @module controllers/uploadController
 * @version 1.0.0
 * @author Cinema Platform Team
 * @since 1.0.0
 */

import { Response, NextFunction } from 'express';
import UploadService from '@/services/uploadService';
import { createError } from '@/middleware/errorHandler';
import { IApiResponse, IAuthenticatedRequest } from '@/types';
import User from '@/models/User';
import Movie from '@/models/Movie';

/**
 * Upload Controller Class
 * @class UploadController
 * @description Handles file upload operations to Cloudinary
 */
export class UploadController {
  private static instance: UploadController;

  /**
   * Get singleton instance
   * @returns {UploadController} Controller instance
   */
  public static getInstance(): UploadController {
    if (!UploadController.instance) {
      UploadController.instance = new UploadController();
    }
    return UploadController.instance;
  }

  /**
   * Upload user avatar
   * @route POST /api/upload/avatar
   * @access Private
   */
  public uploadAvatar = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const file = req.file;

      if (!file) {
        throw createError('No file provided', 400);
      }

      if (!userId) {
        throw createError('Authentication required', 401);
      }

      // Upload to Cloudinary
      const uploadResult = await UploadService.uploadAvatar(file.buffer, userId);

      // Update user avatar in database
      const user = await User.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      // Delete old avatar from Cloudinary if exists
      if (user.avatar && user.avatar.includes('cloudinary.com')) {
        const oldPublicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
        try {
          await UploadService.deleteFile(oldPublicId, 'image');
        } catch (error) {
          console.log('Old avatar deletion failed (might not exist):', error);
        }
      }

      user.avatar = uploadResult.secureUrl;
      await user.save();

      const response: IApiResponse = {
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          url: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload movie poster
   * @route POST /api/upload/poster/:movieId
   * @access Private (Admin only)
   */
  public uploadMoviePoster = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { movieId } = req.params;
      const file = req.file;

      if (!file) {
        throw createError('No file provided', 400);
      }

      if (!movieId || !/^[0-9a-fA-F]{24}$/.test(movieId)) {
        throw createError('Invalid movie ID', 400);
      }

      // Check if movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) {
        throw createError('Movie not found', 404);
      }

      // Upload to Cloudinary
      const uploadResult = await UploadService.uploadMoviePoster(file.buffer, movieId);

      // Delete old poster from Cloudinary if exists
      if (movie.poster && movie.poster.includes('cloudinary.com')) {
        const oldPublicId = movie.poster.split('/').slice(-2).join('/').split('.')[0];
        try {
          await UploadService.deleteFile(oldPublicId, 'image');
        } catch (error) {
          console.log('Old poster deletion failed (might not exist):', error);
        }
      }

      // Update movie poster
      movie.poster = uploadResult.secureUrl;
      await movie.save();

      const response: IApiResponse = {
        success: true,
        message: 'Movie poster uploaded successfully',
        data: {
          url: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          movieId: movie._id,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload movie video
   * @route POST /api/upload/video/:movieId
   * @access Private (Admin only)
   */
  public uploadMovieVideo = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { movieId } = req.params;
      const file = req.file;

      if (!file) {
        throw createError('No file provided', 400);
      }

      if (!movieId || !/^[0-9a-fA-F]{24}$/.test(movieId)) {
        throw createError('Invalid movie ID', 400);
      }

      // Check if movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) {
        throw createError('Movie not found', 404);
      }

      // Upload to Cloudinary
      const uploadResult = await UploadService.uploadMovieVideo(file.buffer, movieId);

      // Delete old video from Cloudinary if exists and is from Cloudinary
      if (movie.videoUrl && movie.videoUrl.includes('cloudinary.com') && movie.videoProvider === 'cloudinary') {
        const oldPublicId = movie.videoUrl.split('/').slice(-2).join('/').split('.')[0];
        try {
          await UploadService.deleteFile(oldPublicId, 'video');
        } catch (error) {
          console.log('Old video deletion failed (might not exist):', error);
        }
      }

      // Update movie video
      movie.videoUrl = uploadResult.secureUrl;
      movie.videoProvider = 'cloudinary';
      if (uploadResult.duration) {
        movie.duration = Math.floor(uploadResult.duration);
      }
      await movie.save();

      const response: IApiResponse = {
        success: true,
        message: 'Movie video uploaded successfully',
        data: {
          url: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          duration: uploadResult.duration,
          movieId: movie._id,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload movie subtitle
   * @route POST /api/upload/subtitle/:movieId
   * @access Private (Admin only)
   */
  public uploadSubtitle = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { movieId } = req.params;
      const { language } = req.body;
      const file = req.file;

      if (!file) {
        throw createError('No file provided', 400);
      }

      if (!language || !['spanish', 'english'].includes(language)) {
        throw createError('Language must be either "spanish" or "english"', 400);
      }

      if (!movieId || !/^[0-9a-fA-F]{24}$/.test(movieId)) {
        throw createError('Invalid movie ID', 400);
      }

      // Check if movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) {
        throw createError('Movie not found', 404);
      }

      // Upload to Cloudinary
      const languageCode = language === 'spanish' ? 'es' : 'en';
      const uploadResult = await UploadService.uploadSubtitle(
        file.buffer,
        movieId,
        languageCode
      );

      // Delete old subtitle if exists
      const oldSubtitleUrl = language === 'spanish' ? movie.subtitles?.spanish : movie.subtitles?.english;
      if (oldSubtitleUrl && oldSubtitleUrl.includes('cloudinary.com')) {
        const oldPublicId = oldSubtitleUrl.split('/').slice(-2).join('/').split('.')[0];
        try {
          await UploadService.deleteFile(oldPublicId, 'raw');
        } catch (error) {
          console.log('Old subtitle deletion failed (might not exist):', error);
        }
      }

      // Update movie subtitle
      if (!movie.subtitles) {
        movie.subtitles = {};
      }
      if (language === 'spanish') {
        movie.subtitles.spanish = uploadResult.secureUrl;
      } else {
        movie.subtitles.english = uploadResult.secureUrl;
      }
      await movie.save();

      const response: IApiResponse = {
        success: true,
        message: 'Subtitle uploaded successfully',
        data: {
          url: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          language,
          movieId: movie._id,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete file from Cloudinary
   * @route DELETE /api/upload/:publicId
   * @access Private (Admin only)
   */
  public deleteFile = async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { publicId } = req.params;
      const { resourceType } = req.query;

      if (!publicId) {
        throw createError('Public ID is required', 400);
      }

      const type = (resourceType as string) || 'image';
      if (!['image', 'video', 'raw'].includes(type)) {
        throw createError('Invalid resource type. Must be: image, video, or raw', 400);
      }

      await UploadService.deleteFile(publicId, type as 'image' | 'video' | 'raw');

      const response: IApiResponse = {
        success: true,
        message: 'File deleted successfully',
        data: { publicId, resourceType: type },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}

// Export singleton instance
export default UploadController.getInstance();
