/**
 * @fileoverview Authentication controller for user registration, login, and password management
 * @description Handles all authentication-related operations including registration, login, logout, and password recovery
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-09-28
 */

import { Response, NextFunction } from 'express';
import { User, IUserDocument } from '../models/User';
import {
  IAuthenticatedRequest,
  IApiResponse,
  IUserRegistration,
  IUserLogin,
  IPasswordResetData,
  IPasswordResetConfirm,
} from '../types';
import { authManager } from '../middleware/auth';
import { emailService } from '../services/emailService';
import { createError, notFoundError, unauthorizedError, conflictError } from '../middleware/errorHandler';
import { environment } from '../config/environment';
import crypto from 'crypto';

/**
 * @class AuthController
 * @description Handles authentication operations
 */
class AuthController {
  /**
   * @method register
   * @description Registers a new user account
   * @route POST /api/auth/register
   * @param {IAuthenticatedRequest} req - Express request object with user registration data
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public async register(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userData: IUserRegistration = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email }).lean();
      if (existingUser) {
        throw conflictError('Email address already exists');
      }

      // Create new user
      const newUser = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        age: userData.age,
      });

      const savedUser = await newUser.save();

      // Generate JWT token
      const token = authManager.generateToken(savedUser._id.toString(), savedUser.email);

      // Prepare response data
      const userResponse = savedUser.toSafeObject();

      const response: IApiResponse = {
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          token,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method login
   * @description Authenticates user and returns JWT token
   * @route POST /api/auth/login
   * @param {IAuthenticatedRequest} req - Express request object with login credentials
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public async login(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password }: IUserLogin = req.body;

      // Find user by email and include password for comparison
      const user = await User.findOne({ email, isActive: true }).select('+password');

      if (!user) {
        throw unauthorizedError('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw unauthorizedError('Invalid email or password');
      }

      // Generate JWT token
      const token = authManager.generateToken(user._id.toString(), user.email);

      // Update last login (could be added to User schema)
      // user.lastLoginAt = new Date();
      // await user.save();

      // Prepare response data
      const userResponse = user.toSafeObject();

      const response: IApiResponse = {
        success: true,
        message: `Welcome back, ${user.firstName}!`,
        data: {
          user: userResponse,
          token,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method logout
   * @description Logs out user (client-side token invalidation)
   * @route POST /api/auth/logout
   * @param {IAuthenticatedRequest} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public async logout(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Note: With JWT, logout is typically handled client-side by removing the token
      // For additional security, you could implement a token blacklist in Redis

      const response: IApiResponse = {
        success: true,
        message: 'Logged out successfully',
        data: {
          message: 'Please remove the token from client storage',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method getProfile
   * @description Gets current user profile
   * @route GET /api/auth/profile
   * @param {IAuthenticatedRequest} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public async getProfile(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw unauthorizedError('User not authenticated');
      }

      const user = await User.findById(req.user.userId);
      if (!user || !user.isActive) {
        throw notFoundError('User');
      }

      const response: IApiResponse = {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: user.toSafeObject(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method updateProfile
   * @description Updates user profile information
   * @route PUT /api/auth/profile
   * @param {IAuthenticatedRequest} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public async updateProfile(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw unauthorizedError('User not authenticated');
      }

      const user = await User.findById(req.user.userId);
      if (!user || !user.isActive) {
        throw notFoundError('User');
      }

      // Update allowed fields
      const allowedUpdates = ['firstName', 'lastName', 'email', 'age', 'avatar'];
      const updates = Object.keys(req.body);
      const isValidOperation = updates.every(update => allowedUpdates.includes(update));

      if (!isValidOperation) {
        throw createError('Invalid updates', 400);
      }

      // Apply updates
      updates.forEach(update => {
        (user as any)[update] = req.body[update];
      });

      const updatedUser = await user.save();

      const response: IApiResponse = {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser.toSafeObject(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method deleteAccount
   * @description Deletes user account (soft delete by setting isActive to false)
   * @route DELETE /api/auth/account
   * @param {IAuthenticatedRequest} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
public async deleteAccount(
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw unauthorizedError('User not authenticated');
    }

    const { password } = req.body;

    if (!password) {
      throw createError('Password confirmation is required to delete account', 400);
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user || !user.isActive) {
      throw notFoundError('User');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw unauthorizedError('Invalid password');
    }

    await User.findByIdAndDelete(req.user.userId);

    const response: IApiResponse = {
      success: true,
      message: 'Account permanently deleted', 
      data: {
        message: 'Your account has been permanently removed. We\'re sorry to see you go!',
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

  /**
   * @method requestPasswordReset
   * @description Initiates password reset process by sending reset email
   * @route POST /api/auth/forgot-password
   * @param {IAuthenticatedRequest} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public async requestPasswordReset(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email }: IPasswordResetData = req.body;

      // Find user by email
      const user = await User.findOne({ email, isActive: true });

      // Always return success to prevent email enumeration attacks
      const response: IApiResponse = {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
        data: {
          message: 'Please check your email for further instructions.',
        },
      };

      if (user) {
        // Generate password reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${environment.get('frontendUrl')}/reset-password?token=${resetToken}`;

        // Send password reset email
        await emailService.sendPasswordResetEmail(user.email, user.getFullName(), resetUrl);

        // Log success in development
        if (environment.isDevelopment()) {
          console.log(`Password reset token for ${email}: ${resetToken}`);
          console.log(`Reset URL: ${resetUrl}`);
        }
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method resetPassword
   * @description Resets user password using reset token
   * @route POST /api/auth/reset-password
   * @param {IAuthenticatedRequest} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
   public async resetPassword(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token, newPassword, confirmPassword }: IPasswordResetConfirm = req.body;

      if (!token || !newPassword || !confirmPassword) {
        throw createError('Token, new password, and password confirmation are required', 400);
      }

      if (newPassword !== confirmPassword) {
        throw createError('Password confirmation does not match new password', 400);
      }

      

      // 1. Hashea el token que viene del frontend para que coincida con el de la BD 🔑
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // 2. Busca al usuario por el token hasheado Y que no haya expirado 🕵️‍♂️
      const user = await User.findOne({ 
        passwordResetToken: hashedToken, 
        passwordResetExpires: { $gt: Date.now() } // $gt significa "greater than" (mayor que)
      });

      // 3. Si no se encuentra un usuario, el token es inválido o expiró
      if (!user) {
        throw createError('Invalid or expired password reset token', 400);
      }
      
      

      // Update password and clear reset token
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      // Send confirmation email
      await emailService.sendPasswordResetConfirmationEmail(user.email, user.getFullName());

      const response: IApiResponse = {
        success: true,
        message: 'Password reset successfully',
        data: {
          message: 'Your password has been updated. Please log in with your new password.',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }


  /**
   * @method changePassword
   * @description Changes user password (for authenticated users)
   * @route POST /api/auth/change-password
   * @param {IAuthenticatedRequest} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public async changePassword(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw unauthorizedError('User not authenticated');
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw createError('Current password, new password, and confirmation are required', 400);
      }

      if (newPassword !== confirmPassword) {
        throw createError('Password confirmation does not match new password', 400);
      }

      const user = await User.findById(req.user.userId).select('+password');
      if (!user || !user.isActive) {
        throw notFoundError('User');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw unauthorizedError('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      const response: IApiResponse = {
        success: true,
        message: 'Password changed successfully',
        data: {
          message: 'Your password has been updated successfully.',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @method verifyToken
   * @description Verifies if a JWT token is valid
   * @route POST /api/auth/verify-token
   * @param {IAuthenticatedRequest} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public async verifyToken(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // If we reach here, the authenticate middleware has already verified the token
      if (!req.user) {
        throw unauthorizedError('Invalid token');
      }

      const response: IApiResponse = {
        success: true,
        message: 'Token is valid',
        data: {
          user: {
            userId: req.user.userId,
            email: req.user.email,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const authController = new AuthController();
export default authController;