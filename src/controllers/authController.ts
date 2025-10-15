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
import { translate } from '../config/i18n';
import { getLanguage } from '../middleware/language';

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
      const lang = getLanguage(req);

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email }).lean();
      if (existingUser) {
        throw conflictError(translate('auth.emailExists', lang));
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
        message: translate('auth.registerSuccess', lang),
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
      const lang = getLanguage(req);

      // Find user by email and include password for comparison
      const user = await User.findOne({ email, isActive: true }).select('+password');

      if (!user) {
        throw unauthorizedError(translate('auth.invalidCredentials', lang));
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw unauthorizedError(translate('auth.invalidCredentials', lang));
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
        message: translate('auth.loginSuccess', lang, { name: user.firstName }),
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
      const lang = getLanguage(req);
      // Note: With JWT, logout is typically handled client-side by removing the token
      // For additional security, you could implement a token blacklist in Redis

      const response: IApiResponse = {
        success: true,
        message: translate('auth.logoutSuccess', lang),
        data: {
          message: translate('auth.logoutMessage', lang),
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
      const lang = getLanguage(req);

      if (!req.user) {
        throw unauthorizedError(translate('auth.authRequired', lang));
      }

      const user = await User.findById(req.user.userId);
      if (!user || !user.isActive) {
        throw notFoundError('User');
      }

      const response: IApiResponse = {
        success: true,
        message: translate('auth.profileRetrieved', lang),
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
      const lang = getLanguage(req);

      if (!req.user) {
        throw unauthorizedError(translate('auth.authRequired', lang));
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
        throw createError(translate('auth.invalidUpdates', lang), 400);
      }

      // Apply updates
      updates.forEach(update => {
        (user as any)[update] = req.body[update];
      });

      const updatedUser = await user.save();

      const response: IApiResponse = {
        success: true,
        message: translate('auth.profileUpdated', lang),
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
      const lang = getLanguage(req);

      if (!req.user) {
        throw unauthorizedError(translate('auth.authRequired', lang));
      }

      const { password } = req.body;

      if (!password) {
        throw createError(translate('auth.passwordRequired', lang), 400);
      }

      const user = await User.findById(req.user.userId).select('+password');
      if (!user || !user.isActive) {
        throw notFoundError('User');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw unauthorizedError(translate('auth.invalidPassword', lang));
      }

      // Soft delete: set isActive to false
      user.isActive = false;
      await user.save();

      // TODO: In a real application, you might want to:
      // 1. Remove user from all related collections (favorites, ratings, comments)
      // 2. Add the user's token to a blacklist
      // 3. Send a confirmation email

      const response: IApiResponse = {
        success: true,
        message: translate('auth.accountDeleted', lang),
        data: {
          message: translate('auth.accountDeletedMessage', lang),
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
      const lang = getLanguage(req);

      // Find user by email
      const user = await User.findOne({ email, isActive: true });

      // Always return success to prevent email enumeration attacks
      const response: IApiResponse = {
        success: true,
        message: translate('auth.passwordResetRequested', lang),
        data: {
          message: translate('auth.passwordResetMessage', lang),
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
      const lang = getLanguage(req);

      if (!token || !newPassword || !confirmPassword) {
        throw createError(translate('auth.resetTokenRequired', lang), 400);
      }

      if (newPassword !== confirmPassword) {
        throw createError(translate('validation.password.newMismatch', lang), 400);
      }

      // Find user with valid reset token
      const user = await User.findOne({
        isActive: true,
      }).select('+passwordResetToken +passwordResetExpires');

      if (!user || !user.isPasswordResetTokenValid(token)) {
        throw createError(translate('auth.tokenInvalid', lang), 400);
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
        message: translate('auth.passwordResetSuccess', lang),
        data: {
          message: translate('auth.passwordResetSuccessMessage', lang),
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
      const lang = getLanguage(req);

      if (!req.user) {
        throw unauthorizedError(translate('auth.authRequired', lang));
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw createError(translate('auth.passwordChangeRequired', lang), 400);
      }

      if (newPassword !== confirmPassword) {
        throw createError(translate('validation.password.newMismatch', lang), 400);
      }

      const user = await User.findById(req.user.userId).select('+password');
      if (!user || !user.isActive) {
        throw notFoundError('User');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw unauthorizedError(translate('auth.incorrectPassword', lang));
      }

      // Update password
      user.password = newPassword;
      await user.save();

      const response: IApiResponse = {
        success: true,
        message: translate('auth.passwordChanged', lang),
        data: {
          message: translate('auth.passwordChangedMessage', lang),
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
      const lang = getLanguage(req);

      // If we reach here, the authenticate middleware has already verified the token
      if (!req.user) {
        throw unauthorizedError(translate('auth.tokenInvalid', lang));
      }

      const response: IApiResponse = {
        success: true,
        message: translate('auth.tokenValid', lang),
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