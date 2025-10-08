/**
 * @fileoverview Authentication middleware for JWT token validation
 * @description Handles JWT token validation and user authentication
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-09-28
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { IAuthenticatedRequest, IJwtPayload, IApiResponse } from '../types';
import { environment } from '../config/environment';

/**
 * @interface ITokenValidationResult
 * @description Interface for token validation result
 */
interface ITokenValidationResult {
  valid: boolean;
  payload?: IJwtPayload;
  error?: string;
}

/**
 * @class AuthenticationManager
 * @description Manages authentication and authorization operations
 */
class AuthenticationManager {
  private static instance: AuthenticationManager;
  private jwtSecret: string;

  /**
   * @constructor
   * @description Private constructor for singleton pattern
   */
  private constructor() {
    this.jwtSecret = environment.get('jwtSecret');
  }

  /**
   * @method getInstance
   * @description Returns singleton instance of AuthenticationManager
   * @returns {AuthenticationManager} Singleton instance
   * @static
   */
  public static getInstance(): AuthenticationManager {
    if (!AuthenticationManager.instance) {
      AuthenticationManager.instance = new AuthenticationManager();
    }
    return AuthenticationManager.instance;
  }

  /**
   * @method generateToken
   * @description Generates JWT token for user
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @returns {string} JWT token
   */
  public generateToken(userId: string, email: string): string {
    const payload: IJwtPayload = {
      userId,
      email,
    };

    const options: any = {
      expiresIn: environment.get('jwtExpiresIn'),
      issuer: 'movies-platform-api',
      audience: 'movies-platform-client',
    };

    return jwt.sign(payload, this.jwtSecret, options);
  }

  /**
   * @method validateToken
   * @description Validates JWT token
   * @param {string} token - JWT token to validate
   * @returns {ITokenValidationResult} Validation result
   */
  public validateToken(token: string): ITokenValidationResult {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        issuer: 'movies-platform-api',
        audience: 'movies-platform-client',
      }) as IJwtPayload;

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      let errorMessage = 'Invalid token';

      if (error instanceof jwt.TokenExpiredError) {
        errorMessage = 'Token has expired';
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorMessage = 'Invalid token format';
      } else if (error instanceof jwt.NotBeforeError) {
        errorMessage = 'Token not active yet';
      }

      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * @method extractTokenFromHeader
   * @description Extracts JWT token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string | null} Extracted token or null
   */
  public extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * @method refreshToken
   * @description Refreshes JWT token if it's close to expiration
   * @param {string} token - Current JWT token
   * @returns {string | null} New token or null if refresh not needed
   */
  public refreshToken(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as IJwtPayload;

      if (!decoded || !decoded.exp) {
        return null;
      }

      // Refresh if token expires in less than 1 hour
      const oneHourInSeconds = 60 * 60;
      const currentTime = Math.floor(Date.now() / 1000);

      if (decoded.exp - currentTime < oneHourInSeconds) {
        return this.generateToken(decoded.userId, decoded.email);
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const authManager = AuthenticationManager.getInstance();

/**
 * @function authenticate
 * @description Middleware to authenticate JWT tokens
 * @param {IAuthenticatedRequest} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const authenticate = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authManager.extractTokenFromHeader(authHeader);

    if (!token) {
      const response: IApiResponse = {
        success: false,
        message: 'Access denied. No token provided.',
        error: 'Authentication required',
      };
      res.status(401).json(response);
      return;
    }

    const validationResult = authManager.validateToken(token);

    if (!validationResult.valid || !validationResult.payload) {
      const response: IApiResponse = {
        success: false,
        message: 'Access denied. Invalid token.',
        error: validationResult.error || 'Invalid token',
      };
      res.status(401).json(response);
      return;
    }

    // Verify user still exists and is active
    const user = await User.findById(validationResult.payload.userId)
      .select('_id email isActive')
      .lean();

    if (!user || !user.isActive) {
      const response: IApiResponse = {
        success: false,
        message: 'Access denied. User account not found or inactive.',
        error: 'User not found',
      };
      res.status(401).json(response);
      return;
    }

    // Attach user info to request object
    req.user = {
      userId: validationResult.payload.userId,
      email: validationResult.payload.email,
    };

    // Check if token needs refresh and add to response headers
    const refreshedToken = authManager.refreshToken(token);
    if (refreshedToken) {
      res.setHeader('X-Refresh-Token', refreshedToken);
    }

    next();
  } catch (error) {
    console.error('❌ Authentication middleware error:', error);

    const response: IApiResponse = {
      success: false,
      message: 'Internal server error during authentication.',
      error: environment.isDevelopment() ? (error as Error).message : 'Authentication failed',
    };

    res.status(500).json(response);
  }
};

/**
 * @function optionalAuthenticate
 * @description Middleware for optional authentication (user may or may not be authenticated)
 * @param {IAuthenticatedRequest} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const optionalAuthenticate = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authManager.extractTokenFromHeader(authHeader);

    if (token) {
      const validationResult = authManager.validateToken(token);

      if (validationResult.valid && validationResult.payload) {
        // Verify user still exists and is active
        const user = await User.findById(validationResult.payload.userId)
          .select('_id email isActive')
          .lean();

        if (user && user.isActive) {
          req.user = {
            userId: validationResult.payload.userId,
            email: validationResult.payload.email,
          };

          // Check if token needs refresh
          const refreshedToken = authManager.refreshToken(token);
          if (refreshedToken) {
            res.setHeader('X-Refresh-Token', refreshedToken);
          }
        }
      }
    }

    // Continue regardless of authentication status
    next();
  } catch (error) {
    console.error('❌ Optional authentication middleware error:', error);
    // Continue even if there's an error in optional authentication
    next();
  }
};

/**
 * @function requireAdmin
 * @description Middleware to require admin role (future implementation)
 * @param {IAuthenticatedRequest} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const requireAdmin = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // First ensure user is authenticated
  if (!req.user) {
    const response: IApiResponse = {
      success: false,
      message: 'Access denied. Authentication required.',
      error: 'Authentication required',
    };
    res.status(401).json(response);
    return;
  }

  // TODO: Implement admin role checking when user roles are added
  // For now, all authenticated users have access
  next();
};

/**
 * @function validateTokenOwnership
 * @description Middleware to validate that user owns the resource they're trying to access
 * @param {string} resourceUserIdField - Field name containing the user ID in the resource
 * @returns {Function} Middleware function
 */
export const validateTokenOwnership = (resourceUserIdField: string = 'userId') => {
  return async (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        const response: IApiResponse = {
          success: false,
          message: 'Access denied. Authentication required.',
          error: 'Authentication required',
        };
        res.status(401).json(response);
        return;
      }

      // Get the user ID from request params, body, or query
      const resourceUserId = req.params[resourceUserIdField] ||
                           req.body[resourceUserIdField] ||
                           req.query[resourceUserIdField];

      if (!resourceUserId) {
        const response: IApiResponse = {
          success: false,
          message: 'Resource user ID not found in request.',
          error: 'Invalid request',
        };
        res.status(400).json(response);
        return;
      }

      // Check if the authenticated user owns the resource
      if (req.user.userId !== resourceUserId) {
        const response: IApiResponse = {
          success: false,
          message: 'Access denied. You can only access your own resources.',
          error: 'Forbidden',
        };
        res.status(403).json(response);
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Token ownership validation error:', error);

      const response: IApiResponse = {
        success: false,
        message: 'Internal server error during authorization.',
        error: environment.isDevelopment() ? (error as Error).message : 'Authorization failed',
      };

      res.status(500).json(response);
    }
  };
};

export default authManager;