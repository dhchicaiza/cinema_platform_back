/**
 * @fileoverview Upload service for handling media uploads to Cloudinary
 * @description Provides functions to upload images and videos to Cloudinary
 * @module services/uploadService
 * @version 1.0.0
 * @since 1.0.0
 */

import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

/**
 * Upload options interface
 * @interface UploadOptions
 */
export interface UploadOptions {
  folder?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any[];
  format?: string;
  quality?: string | number;
  tags?: string[];
}

/**
 * Upload result interface
 * @interface UploadResult
 */
export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format: string;
  resourceType: string;
  bytes: number;
  duration?: number; // For videos
}

/**
 * Upload Service Class
 * @class UploadService
 * @description Handles file uploads to Cloudinary with various options
 */
export class UploadService {
  /**
   * Upload file buffer to Cloudinary
   * @description Uploads a file buffer to Cloudinary with specified options
   * @param {Buffer} fileBuffer - File buffer to upload
   * @param {UploadOptions} options - Upload options
   * @returns {Promise<UploadResult>} Upload result with URLs and metadata
   * @throws {Error} If upload fails
   */
  static async uploadBuffer(
    fileBuffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: options.folder || 'cinema-platform',
        resource_type: options.resourceType || 'auto',
        public_id: options.publicId,
        transformation: options.transformation,
        format: options.format,
        quality: options.quality,
        tags: options.tags || [],
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else if (result) {
            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              resourceType: result.resource_type,
              bytes: result.bytes,
              duration: result.duration,
            });
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = Readable.from(fileBuffer);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Upload image from buffer
   * @description Uploads an image to Cloudinary with optimizations
   * @param {Buffer} fileBuffer - Image buffer
   * @param {string} folder - Cloudinary folder (default: 'cinema-platform/images')
   * @param {string} publicId - Optional public ID
   * @returns {Promise<UploadResult>} Upload result
   */
  static async uploadImage(
    fileBuffer: Buffer,
    folder: string = 'cinema-platform/images',
    publicId?: string
  ): Promise<UploadResult> {
    return this.uploadBuffer(fileBuffer, {
      folder,
      publicId,
      resourceType: 'image',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    });
  }

  /**
   * Upload avatar image
   * @description Uploads user avatar with specific transformations
   * @param {Buffer} fileBuffer - Avatar image buffer
   * @param {string} userId - User ID for unique naming
   * @returns {Promise<UploadResult>} Upload result
   */
  static async uploadAvatar(
    fileBuffer: Buffer,
    userId: string
  ): Promise<UploadResult> {
    return this.uploadBuffer(fileBuffer, {
      folder: 'cinema-platform/avatars',
      publicId: `avatar-${userId}`,
      resourceType: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
      tags: ['avatar', userId],
    });
  }

  /**
   * Upload movie poster
   * @description Uploads movie poster with specific transformations
   * @param {Buffer} fileBuffer - Poster image buffer
   * @param {string} movieId - Movie ID for unique naming
   * @returns {Promise<UploadResult>} Upload result
   */
  static async uploadMoviePoster(
    fileBuffer: Buffer,
    movieId: string
  ): Promise<UploadResult> {
    return this.uploadBuffer(fileBuffer, {
      folder: 'cinema-platform/posters',
      publicId: `poster-${movieId}`,
      resourceType: 'image',
      transformation: [
        { width: 800, height: 1200, crop: 'fill' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
      tags: ['poster', movieId],
    });
  }

  /**
   * Upload video file
   * @description Uploads video to Cloudinary with optimizations
   * @param {Buffer} fileBuffer - Video buffer
   * @param {string} folder - Cloudinary folder (default: 'cinema-platform/videos')
   * @param {string} publicId - Optional public ID
   * @returns {Promise<UploadResult>} Upload result
   */
  static async uploadVideo(
    fileBuffer: Buffer,
    folder: string = 'cinema-platform/videos',
    publicId?: string
  ): Promise<UploadResult> {
    return this.uploadBuffer(fileBuffer, {
      folder,
      publicId,
      resourceType: 'video',
      transformation: [
        { quality: 'auto' },
      ],
    });
  }

  /**
   * Upload movie video
   * @description Uploads movie video file
   * @param {Buffer} fileBuffer - Video buffer
   * @param {string} movieId - Movie ID for unique naming
   * @returns {Promise<UploadResult>} Upload result
   */
  static async uploadMovieVideo(
    fileBuffer: Buffer,
    movieId: string
  ): Promise<UploadResult> {
    return this.uploadBuffer(fileBuffer, {
      folder: 'cinema-platform/movies',
      publicId: `movie-${movieId}`,
      resourceType: 'video',
      transformation: [
        { quality: 'auto:good' },
      ],
      tags: ['movie', movieId],
    });
  }

  /**
   * Upload subtitle file
   * @description Uploads subtitle file (SRT, VTT) as raw file
   * @param {Buffer} fileBuffer - Subtitle file buffer
   * @param {string} movieId - Movie ID
   * @param {string} language - Language code (en, es)
   * @returns {Promise<UploadResult>} Upload result
   */
  static async uploadSubtitle(
    fileBuffer: Buffer,
    movieId: string,
    language: string
  ): Promise<UploadResult> {
    return this.uploadBuffer(fileBuffer, {
      folder: 'cinema-platform/subtitles',
      publicId: `subtitle-${movieId}-${language}`,
      resourceType: 'raw',
      tags: ['subtitle', movieId, language],
    });
  }

  /**
   * Delete file from Cloudinary
   * @description Deletes a file from Cloudinary by public ID
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - Resource type (image, video, raw)
   * @returns {Promise<void>}
   * @throws {Error} If deletion fails
   */
  static async deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error: any) {
      throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
    }
  }

  /**
   * Get file URL from public ID
   * @description Generates secure URL for a Cloudinary file
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - Resource type (image, video)
   * @param {any[]} transformations - Optional transformations
   * @returns {string} Secure URL
   */
  static getFileUrl(
    publicId: string,
    resourceType: 'image' | 'video' = 'image',
    transformations?: any[]
  ): string {
    return cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      transformation: transformations,
    });
  }

  /**
   * Generate thumbnail URL for video
   * @description Generates thumbnail image URL from video
   * @param {string} videoPublicId - Video public ID
   * @param {number} width - Thumbnail width (default: 400)
   * @param {number} height - Thumbnail height (default: 300)
   * @returns {string} Thumbnail URL
   */
  static getVideoThumbnail(
    videoPublicId: string,
    width: number = 400,
    height: number = 300
  ): string {
    return cloudinary.url(videoPublicId, {
      resource_type: 'video',
      secure: true,
      transformation: [
        { width, height, crop: 'fill' },
        { format: 'jpg' },
        { quality: 'auto' },
      ],
    });
  }

  /**
   * Validate file type
   * @description Validates if file type is allowed
   * @param {string} mimetype - File MIME type
   * @param {string[]} allowedTypes - Allowed MIME types
   * @returns {boolean} True if valid
   */
  static isValidFileType(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file size
   * @description Validates if file size is within limit
   * @param {number} size - File size in bytes
   * @param {number} maxSize - Maximum size in bytes
   * @returns {boolean} True if valid
   */
  static isValidFileSize(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }
}

export default UploadService;
