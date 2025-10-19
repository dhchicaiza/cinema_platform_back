/**
 * @fileoverview Multer middleware configuration for file uploads
 * @description Configures multer for handling multipart/form-data file uploads
 * @module middleware/upload
 * @version 1.0.0
 * @since 1.0.0
 */

import multer from 'multer';
import { Request } from 'express';

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

/**
 * Allowed video MIME types
 */
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
];

/**
 * Allowed subtitle MIME types
 */
export const ALLOWED_SUBTITLE_TYPES = [
  'text/plain',
  'text/vtt',
  'application/x-subrip',
];

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  AVATAR: 5 * 1024 * 1024, // 5MB
  POSTER: 10 * 1024 * 1024, // 10MB
  VIDEO: 500 * 1024 * 1024, // 500MB
  SUBTITLE: 1 * 1024 * 1024, // 1MB
};

/**
 * File filter function for images
 * @param {Request} req - Express request
 * @param {Express.Multer.File} file - Multer file
 * @param {multer.FileFilterCallback} cb - Callback function
 */
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
  }
};

/**
 * File filter function for videos
 * @param {Request} req - Express request
 * @param {Express.Multer.File} file - Multer file
 * @param {multer.FileFilterCallback} cb - Callback function
 */
const videoFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`));
  }
};

/**
 * File filter function for subtitles
 * @param {Request} req - Express request
 * @param {Express.Multer.File} file - Multer file
 * @param {multer.FileFilterCallback} cb - Callback function
 */
const subtitleFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_SUBTITLE_TYPES.includes(file.mimetype) ||
      file.originalname.endsWith('.srt') ||
      file.originalname.endsWith('.vtt')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: .srt, .vtt'));
  }
};

/**
 * Multer configuration for avatar uploads
 * - Memory storage (buffer)
 * - 5MB file size limit
 * - Image files only
 */
export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMITS.AVATAR,
  },
  fileFilter: imageFileFilter,
});

/**
 * Multer configuration for poster uploads
 * - Memory storage (buffer)
 * - 10MB file size limit
 * - Image files only
 */
export const uploadPoster = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMITS.POSTER,
  },
  fileFilter: imageFileFilter,
});

/**
 * Multer configuration for video uploads
 * - Memory storage (buffer)
 * - 500MB file size limit
 * - Video files only
 */
export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMITS.VIDEO,
  },
  fileFilter: videoFileFilter,
});

/**
 * Multer configuration for subtitle uploads
 * - Memory storage (buffer)
 * - 1MB file size limit
 * - Subtitle files only (.srt, .vtt)
 */
export const uploadSubtitle = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_SIZE_LIMITS.SUBTITLE,
  },
  fileFilter: subtitleFileFilter,
});

/**
 * Generic multer configuration
 * - Memory storage (buffer)
 * - 50MB file size limit
 * - No file type restrictions
 */
export const uploadGeneric = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});
