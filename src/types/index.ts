/**
 * @fileoverview Type definitions for the Movies Platform Backend API
 * @description This file contains all TypeScript interfaces and types used throughout the application
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-09-28
 */

import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

/**
 * @interface IUser
 * @description Interface for User data structure
 */
export interface IUser {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  age: number;
  avatar?: string;
  isActive?: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

/**
 * @interface IUserRegistration
 * @description Interface for user registration data
 */
export interface IUserRegistration {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
}

/**
 * @interface IUserLogin
 * @description Interface for user login credentials
 */
export interface IUserLogin {
  email: string;
  password: string;
}

/**
 * @interface IUserProfile
 * @description Interface for user profile update data
 */
export interface IUserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  avatar?: string;
}

/**
 * @interface IMovie
 * @description Interface for Movie data structure
 */
export interface IMovie {
  _id?: string;
  title: string;
  description: string;
  genre: string[];
  duration: number;
  poster: string;
  videoUrl: string;
  subtitles?: {
    spanish?: string;
    english?: string;
  };
  averageRating?: number;
  totalRatings?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @interface IFavorite
 * @description Interface for Favorite data structure
 */
export interface IFavorite {
  _id?: string;
  userId: string;
  movieId: string;
  createdAt?: Date;
}

/**
 * @interface IRating
 * @description Interface for Rating data structure
 */
export interface IRating {
  _id?: string;
  userId: string;
  movieId: string;
  rating: number; // 1-5 stars
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @interface IComment
 * @description Interface for Comment data structure
 */
export interface IComment {
  _id?: string;
  userId: string;
  movieId: string;
  content: string;
  edited: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * @interface IJwtPayload
 * @description Interface for JWT token payload
 */
export interface IJwtPayload extends JwtPayload {
  userId: string;
  email: string;
}

/**
 * @interface IAuthenticatedRequest
 * @description Extended Express Request interface with authenticated user
 */
export interface IAuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * @interface IApiResponse
 * @description Generic interface for API responses
 */
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: string[];
}

/**
 * @interface IPaginationQuery
 * @description Interface for pagination query parameters
 */
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * @interface IMovieQuery
 * @description Interface for movie search and filter query parameters
 */
export interface IMovieQuery extends IPaginationQuery {
  title?: string;
  genre?: string;
  minRating?: number;
}

/**
 * @interface IEmailData
 * @description Interface for email data structure
 */
export interface IEmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * @interface IPasswordResetData
 * @description Interface for password reset request data
 */
export interface IPasswordResetData {
  email: string;
}

/**
 * @interface IPasswordResetConfirm
 * @description Interface for password reset confirmation data
 */
export interface IPasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * @interface ICloudinaryUploadResult
 * @description Interface for Cloudinary upload result
 */
export interface ICloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
}

/**
 * @type ValidationError
 * @description Type for validation error objects
 */
export type ValidationError = {
  field: string;
  message: string;
  value?: any;
};

/**
 * @type HttpStatusCode
 * @description Type for HTTP status codes
 */
export type HttpStatusCode = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 409 | 422 | 423 | 429 | 500 | 503;

/**
 * @type UserRole
 * @description Type for user roles (future extension)
 */
export type UserRole = 'user' | 'admin' | 'moderator';

/**
 * @type MovieGenre
 * @description Type for movie genres
 */
export type MovieGenre =
  | 'Action'
  | 'Adventure'
  | 'Comedy'
  | 'Drama'
  | 'Horror'
  | 'Romance'
  | 'Sci-Fi'
  | 'Thriller'
  | 'Fantasy'
  | 'Mystery'
  | 'Crime'
  | 'Documentary'
  | 'Animation'
  | 'Family';

/**
 * @type SortOrder
 * @description Type for sorting order
 */
export type SortOrder = 'asc' | 'desc' | 1 | -1;

/**
 * @type Environment
 * @description Type for application environment
 */
export type Environment = 'development' | 'production' | 'test';