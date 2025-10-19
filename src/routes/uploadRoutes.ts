/**
 * @fileoverview Upload routes configuration
 * @description Defines routes for file upload operations
 * @module routes/uploadRoutes
 * @version 1.0.0
 * @since 1.0.0
 */

import { Router } from 'express';
import uploadController from '@/controllers/uploadController';
import { authenticate } from '@/middleware/auth';
import {
  uploadAvatar,
  uploadPoster,
  uploadVideo,
  uploadSubtitle,
} from '@/middleware/upload';

const router = Router();

/**
 * @route POST /api/upload/avatar
 * @description Upload user avatar image
 * @access Private
 * @body {File} avatar - Avatar image file (max 5MB, jpeg/jpg/png/gif/webp)
 */
router.post(
  '/avatar',
  authenticate,
  uploadAvatar.single('avatar'),
  uploadController.uploadAvatar
);

/**
 * @route POST /api/upload/poster/:movieId
 * @description Upload movie poster image
 * @access Private (Admin only - TODO: add admin middleware)
 * @param {string} movieId - Movie ID
 * @body {File} poster - Poster image file (max 10MB, jpeg/jpg/png/gif/webp)
 */
router.post(
  '/poster/:movieId',
  authenticate, // TODO: Add admin middleware
  uploadPoster.single('poster'),
  uploadController.uploadMoviePoster
);

/**
 * @route POST /api/upload/video/:movieId
 * @description Upload movie video file
 * @access Private (Admin only - TODO: add admin middleware)
 * @param {string} movieId - Movie ID
 * @body {File} video - Video file (max 500MB, mp4/mpeg/mov/avi/webm)
 */
router.post(
  '/video/:movieId',
  authenticate, // TODO: Add admin middleware
  uploadVideo.single('video'),
  uploadController.uploadMovieVideo
);

/**
 * @route POST /api/upload/subtitle/:movieId
 * @description Upload movie subtitle file
 * @access Private (Admin only - TODO: add admin middleware)
 * @param {string} movieId - Movie ID
 * @body {File} subtitle - Subtitle file (max 1MB, .srt or .vtt)
 * @body {string} language - Language: "spanish" or "english"
 */
router.post(
  '/subtitle/:movieId',
  authenticate, // TODO: Add admin middleware
  uploadSubtitle.single('subtitle'),
  uploadController.uploadSubtitle
);

/**
 * @route DELETE /api/upload/:publicId
 * @description Delete file from Cloudinary
 * @access Private (Admin only - TODO: add admin middleware)
 * @param {string} publicId - Cloudinary public ID
 * @query {string} resourceType - Resource type: "image", "video", or "raw"
 */
router.delete(
  '/:publicId',
  authenticate, // TODO: Add admin middleware
  uploadController.deleteFile
);

export default router;
