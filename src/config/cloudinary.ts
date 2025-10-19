/**
 * @fileoverview Cloudinary configuration and initialization
 * @description Configures Cloudinary SDK with environment credentials
 * @module config/cloudinary
 * @version 1.0.0
 * @since 1.0.0
 */

import { v2 as cloudinary } from 'cloudinary';
import { environment } from './environment';

/**
 * Configure Cloudinary with credentials from environment variables
 * @description Initializes Cloudinary SDK with cloud name, API key, and API secret
 * @returns {void}
 */
export const configureCloudinary = (): void => {
  cloudinary.config({
    cloud_name: environment.get('cloudinaryCloudName'),
    api_key: environment.get('cloudinaryApiKey'),
    api_secret: environment.get('cloudinaryApiSecret'),
    secure: true, // Use HTTPS URLs
  });

  console.log('Cloudinary configured successfully');
  console.log(`Cloud Name: ${environment.get('cloudinaryCloudName')}`);
};

/**
 * Get configured Cloudinary instance
 * @description Returns the configured Cloudinary v2 instance
 * @returns {typeof cloudinary} Cloudinary v2 instance
 */
export const getCloudinary = (): typeof cloudinary => {
  return cloudinary;
};

export default cloudinary;
