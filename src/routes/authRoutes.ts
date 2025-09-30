/**
 * @fileoverview Authentication routes for user registration, login, and password management
 * @description Defines REST API endpoints for authentication operations
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-09-28
 */

import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import {
  validateUserRegistration,
  validateUserLogin,
  validateUserProfile,
} from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * @const authRouter
 * @description Express router for authentication endpoints
 */
const authRouter = Router();

/**
 * @route POST /api/auth/register
 * @description Register a new user account
 * @access Public
 * @param {Object} req.body - User registration data
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {string} req.body.confirmPassword - Password confirmation
 * @param {number} req.body.age - User's age
 * @returns {Object} 201 - User created successfully with JWT token
 * @returns {Object} 400 - Validation error
 * @returns {Object} 409 - Email already exists
 * @returns {Object} 422 - Validation failed
 * @returns {Object} 500 - Internal server error
 * @example
 * // Request body
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "john.doe@example.com",
 *   "password": "SecurePass123",
 *   "confirmPassword": "SecurePass123",
 *   "age": 25
 * }
 *
 * // Response 201
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "data": {
 *     "user": {
 *       "id": "60d0fe4f5311236168a109ca",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       "age": 25,
 *       "isActive": true,
 *       "createdAt": "2025-09-28T10:00:00.000Z"
 *     },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
authRouter.post('/register', validateUserRegistration, asyncHandler(authController.register));

/**
 * @route POST /api/auth/login
 * @description Authenticate user and return JWT token
 * @access Public
 * @param {Object} req.body - User login credentials
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @returns {Object} 200 - Login successful with JWT token
 * @returns {Object} 401 - Invalid credentials
 * @returns {Object} 422 - Validation failed
 * @returns {Object} 500 - Internal server error
 * @example
 * // Request body
 * {
 *   "email": "john.doe@example.com",
 *   "password": "SecurePass123"
 * }
 *
 * // Response 200
 * {
 *   "success": true,
 *   "message": "Welcome back, John!",
 *   "data": {
 *     "user": {
 *       "id": "60d0fe4f5311236168a109ca",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       "age": 25,
 *       "isActive": true
 *     },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
authRouter.post('/login', validateUserLogin, asyncHandler(authController.login));

/**
 * @route POST /api/auth/logout
 * @description Log out user (client-side token invalidation)
 * @access Private
 * @security BearerAuth
 * @returns {Object} 200 - Logout successful
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 500 - Internal server error
 * @example
 * // Response 200
 * {
 *   "success": true,
 *   "message": "Logged out successfully",
 *   "data": {
 *     "message": "Please remove the token from client storage"
 *   }
 * }
 */
authRouter.post('/logout', authenticate, asyncHandler(authController.logout));

/**
 * @route GET /api/auth/profile
 * @description Get current user's profile information
 * @access Private
 * @security BearerAuth
 * @returns {Object} 200 - User profile retrieved successfully
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Internal server error
 * @example
 * // Response 200
 * {
 *   "success": true,
 *   "message": "Profile retrieved successfully",
 *   "data": {
 *     "user": {
 *       "id": "60d0fe4f5311236168a109ca",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       "age": 25,
 *       "avatar": "https://example.com/avatar.jpg",
 *       "isActive": true,
 *       "createdAt": "2025-09-28T10:00:00.000Z",
 *       "updatedAt": "2025-09-28T10:00:00.000Z"
 *     }
 *   }
 * }
 */
authRouter.get('/profile', authenticate, asyncHandler(authController.getProfile));

/**
 * @route PUT /api/auth/profile
 * @description Update current user's profile information
 * @access Private
 * @security BearerAuth
 * @param {Object} req.body - Profile update data (all fields optional)
 * @param {string} [req.body.firstName] - User's first name
 * @param {string} [req.body.lastName] - User's last name
 * @param {string} [req.body.email] - User's email address
 * @param {number} [req.body.age] - User's age
 * @param {string} [req.body.avatar] - User's avatar URL
 * @returns {Object} 200 - Profile updated successfully
 * @returns {Object} 400 - Invalid updates
 * @returns {Object} 401 - Unauthorized
 * @returns {Object} 404 - User not found
 * @returns {Object} 409 - Email already exists
 * @returns {Object} 422 - Validation failed
 * @returns {Object} 500 - Internal server error
 * @example
 * // Request body
 * {
 *   "firstName": "John",
 *   "age": 26,
 *   "avatar": "https://example.com/new-avatar.jpg"
 * }
 *
 * // Response 200
 * {
 *   "success": true,
 *   "message": "Profile updated successfully",
 *   "data": {
 *     "user": {
 *       "id": "60d0fe4f5311236168a109ca",
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       "age": 26,
 *       "avatar": "https://example.com/new-avatar.jpg",
 *       "isActive": true,
 *       "updatedAt": "2025-09-28T11:00:00.000Z"
 *     }
 *   }
 * }
 */
authRouter.put('/profile', authenticate, validateUserProfile, asyncHandler(authController.updateProfile));

/**
 * @route DELETE /api/auth/account
 * @description Delete user account (soft delete)
 * @access Private
 * @security BearerAuth
 * @param {Object} req.body - Account deletion confirmation
 * @param {string} req.body.password - Current password for confirmation
 * @returns {Object} 200 - Account deleted successfully
 * @returns {Object} 400 - Password confirmation required
 * @returns {Object} 401 - Unauthorized or invalid password
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Internal server error
 * @example
 * // Request body
 * {
 *   "password": "SecurePass123"
 * }
 *
 * // Response 200
 * {
 *   "success": true,
 *   "message": "Account deleted successfully",
 *   "data": {
 *     "message": "Your account has been deactivated. We're sorry to see you go!"
 *   }
 * }
 */
authRouter.delete('/account', authenticate, asyncHandler(authController.deleteAccount));

/**
 * @route POST /api/auth/forgot-password
 * @description Request password reset email
 * @access Public
 * @param {Object} req.body - Password reset request
 * @param {string} req.body.email - User's email address
 * @returns {Object} 200 - Password reset email sent (always returns success for security)
 * @returns {Object} 422 - Validation failed
 * @returns {Object} 500 - Internal server error
 * @example
 * // Request body
 * {
 *   "email": "john.doe@example.com"
 * }
 *
 * // Response 200
 * {
 *   "success": true,
 *   "message": "If an account with that email exists, a password reset link has been sent.",
 *   "data": {
 *     "message": "Please check your email for further instructions."
 *   }
 * }
 */
authRouter.post('/forgot-password', asyncHandler(authController.requestPasswordReset));

/**
 * @route POST /api/auth/reset-password
 * @description Reset password using reset token
 * @access Public
 * @param {Object} req.body - Password reset data
 * @param {string} req.body.token - Password reset token from email
 * @param {string} req.body.newPassword - New password
 * @param {string} req.body.confirmPassword - Password confirmation
 * @returns {Object} 200 - Password reset successfully
 * @returns {Object} 400 - Invalid or expired token, or validation errors
 * @returns {Object} 500 - Internal server error
 * @example
 * // Request body
 * {
 *   "token": "abc123def456ghi789",
 *   "newPassword": "NewSecurePass123",
 *   "confirmPassword": "NewSecurePass123"
 * }
 *
 * // Response 200
 * {
 *   "success": true,
 *   "message": "Password reset successfully",
 *   "data": {
 *     "message": "Your password has been updated. Please log in with your new password."
 *   }
 * }
 */
authRouter.post('/reset-password', asyncHandler(authController.resetPassword));

/**
 * @route POST /api/auth/change-password
 * @description Change password for authenticated user
 * @access Private
 * @security BearerAuth
 * @param {Object} req.body - Password change data
 * @param {string} req.body.currentPassword - Current password
 * @param {string} req.body.newPassword - New password
 * @param {string} req.body.confirmPassword - Password confirmation
 * @returns {Object} 200 - Password changed successfully
 * @returns {Object} 400 - Validation errors
 * @returns {Object} 401 - Unauthorized or incorrect current password
 * @returns {Object} 404 - User not found
 * @returns {Object} 500 - Internal server error
 * @example
 * // Request body
 * {
 *   "currentPassword": "SecurePass123",
 *   "newPassword": "NewSecurePass123",
 *   "confirmPassword": "NewSecurePass123"
 * }
 *
 * // Response 200
 * {
 *   "success": true,
 *   "message": "Password changed successfully",
 *   "data": {
 *     "message": "Your password has been updated successfully."
 *   }
 * }
 */
authRouter.post('/change-password', authenticate, asyncHandler(authController.changePassword));

/**
 * @route POST /api/auth/verify-token
 * @description Verify if JWT token is valid
 * @access Private
 * @security BearerAuth
 * @returns {Object} 200 - Token is valid
 * @returns {Object} 401 - Invalid token
 * @returns {Object} 500 - Internal server error
 * @example
 * // Response 200
 * {
 *   "success": true,
 *   "message": "Token is valid",
 *   "data": {
 *     "user": {
 *       "userId": "60d0fe4f5311236168a109ca",
 *       "email": "john.doe@example.com"
 *     }
 *   }
 * }
 */
authRouter.post('/verify-token', authenticate, asyncHandler(authController.verifyToken));

export default authRouter;