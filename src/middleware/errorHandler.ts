/**
 * @fileoverview Error handling middleware for the API
 * @description Centralized error handling with proper HTTP status codes and messages
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-09-28
 */

import { Request, Response, NextFunction } from 'express';
import { IApiResponse, HttpStatusCode } from '../types';
import { environment } from '../config/environment';

/**
 * @interface ICustomError
 * @description Interface for custom error objects
 */
interface ICustomError extends Error {
  statusCode?: HttpStatusCode;
  code?: number;
  field?: string;
  errors?: any[];
  path?: string;
  value?: any;
}

/**
 * @class ErrorHandler
 * @description Centralized error handling class
 */
class ErrorHandler {
  /**
   * @method handleCastError
   * @description Handles MongoDB cast errors (invalid ObjectId)
   * @param {ICustomError} error - Cast error object
   * @returns {IApiResponse} Formatted error response
   * @static
   */
  static handleCastError(error: ICustomError): IApiResponse {
    const message = `Invalid ${error.path}: ${error.value}`;
    return {
      success: false,
      message: 'Invalid data format',
      error: message,
    };
  }

  /**
   * @method handleDuplicateFieldError
   * @description Handles MongoDB duplicate field errors
   * @param {ICustomError} error - Duplicate error object
   * @returns {IApiResponse} Formatted error response
   * @static
   */
  static handleDuplicateFieldError(error: ICustomError): IApiResponse {
    let field = 'field';
    let value = 'value';

    if (error.message.includes('email')) {
      field = 'email';
      const emailMatch = error.message.match(/email: "([^"]+)"/);
      value = emailMatch ? emailMatch[1] : 'email';
    }

    return {
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      error: `The ${field} '${value}' is already in use`,
    };
  }

  /**
   * @method handleValidationError
   * @description Handles MongoDB validation errors
   * @param {ICustomError} error - Validation error object
   * @returns {IApiResponse} Formatted error response
   * @static
   */
  static handleValidationError(error: ICustomError): IApiResponse {
    const errors = error.errors ? Object.values(error.errors) : [];
    const errorMessages = errors.map((err: any) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));

    return {
      success: false,
      message: 'Validation failed',
      error: 'Please check the provided data',
      errors: errorMessages.map(err => `${err.field}: ${err.message}`),
    };
  }

  /**
   * @method handleJWTError
   * @description Handles JWT related errors
   * @param {ICustomError} error - JWT error object
   * @returns {IApiResponse} Formatted error response
   * @static
   */
  static handleJWTError(error: ICustomError): IApiResponse {
    let message = 'Invalid token';

    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired. Please log in again';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token format. Please log in again';
    } else if (error.name === 'NotBeforeError') {
      message = 'Token not active yet';
    }

    return {
      success: false,
      message: 'Authentication failed',
      error: message,
    };
  }

  /**
   * @method getStatusCode
   * @description Determines appropriate HTTP status code for error
   * @param {ICustomError} error - Error object
   * @returns {HttpStatusCode} HTTP status code
   * @static
   */
  static getStatusCode(error: ICustomError): HttpStatusCode {
    // If statusCode is already set, use it
    if (error.statusCode) {
      return error.statusCode;
    }

    // Determine status code based on error type
    switch (error.name) {
      case 'CastError':
        return 400;
      case 'ValidationError':
        return 422;
      case 'MongoServerError':
        return error.code === 11000 ? 409 : 500;
      case 'TokenExpiredError':
      case 'JsonWebTokenError':
      case 'NotBeforeError':
        return 401;
      case 'TypeError':
      case 'ReferenceError':
        return 400;
      default:
        return 500;
    }
  }

  /**
   * @method formatError
   * @description Formats error object into standardized API response
   * @param {ICustomError} error - Error object to format
   * @returns {IApiResponse} Formatted error response
   * @static
   */
  static formatError(error: ICustomError): IApiResponse {
    switch (error.name) {
      case 'CastError':
        return this.handleCastError(error);
      case 'ValidationError':
        return this.handleValidationError(error);
      case 'MongoServerError':
        if (error.code === 11000) {
          return this.handleDuplicateFieldError(error);
        }
        break;
      case 'TokenExpiredError':
      case 'JsonWebTokenError':
      case 'NotBeforeError':
        return this.handleJWTError(error);
    }

    // Default error format
    return {
      success: false,
      message: error.message || 'An error occurred',
      error: environment.isDevelopment()
        ? error.stack || error.message
        : 'Internal server error',
    };
  }
}

/**
 * @function notFound
 * @description Middleware for handling 404 Not Found errors
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error: ICustomError = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * @function errorHandler
 * @description Main error handling middleware
 * @param {ICustomError} error - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const errorHandler = (
  error: ICustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details in development
  if (environment.isDevelopment()) {
    console.error('ERROR DETAILS:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  } else {
    // Log only essential info in production
    console.error('ERROR:', {
      name: error.name,
      message: error.message,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Get appropriate status code
  const statusCode = ErrorHandler.getStatusCode(error);

  // Format error response
  const errorResponse = ErrorHandler.formatError(error);

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * @function asyncHandler
 * @description Wrapper for async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * @function createError
 * @description Helper function to create custom errors
 * @param {string} message - Error message
 * @param {HttpStatusCode} statusCode - HTTP status code
 * @param {string} field - Field related to error (optional)
 * @returns {ICustomError} Custom error object
 */
export const createError = (
  message: string,
  statusCode: HttpStatusCode,
  field?: string
): ICustomError => {
  const error: ICustomError = new Error(message);
  error.statusCode = statusCode;
  if (field) {
    error.field = field;
  }
  return error;
};

/**
 * @function validationError
 * @description Helper function to create validation errors
 * @param {string} field - Field name
 * @param {string} message - Validation message
 * @param {any} value - Invalid value
 * @returns {ICustomError} Validation error object
 */
export const validationError = (
  field: string,
  message: string,
  value?: any
): ICustomError => {
  const error: ICustomError = new Error(`Validation failed for field: ${field}`);
  error.statusCode = 422;
  error.field = field;
  error.value = value;
  error.name = 'ValidationError';
  return error;
};

/**
 * @function unauthorizedError
 * @description Helper function to create unauthorized errors
 * @param {string} message - Error message
 * @returns {ICustomError} Unauthorized error object
 */
export const unauthorizedError = (message: string = 'Unauthorized'): ICustomError => {
  return createError(message, 401);
};

/**
 * @function forbiddenError
 * @description Helper function to create forbidden errors
 * @param {string} message - Error message
 * @returns {ICustomError} Forbidden error object
 */
export const forbiddenError = (message: string = 'Forbidden'): ICustomError => {
  return createError(message, 403);
};

/**
 * @function notFoundError
 * @description Helper function to create not found errors
 * @param {string} resource - Resource name
 * @returns {ICustomError} Not found error object
 */
export const notFoundError = (resource: string = 'Resource'): ICustomError => {
  return createError(`${resource} not found`, 404);
};

/**
 * @function conflictError
 * @description Helper function to create conflict errors
 * @param {string} message - Error message
 * @returns {ICustomError} Conflict error object
 */
export const conflictError = (message: string): ICustomError => {
  return createError(message, 409);
};

/**
 * @function rateLimitError
 * @description Helper function to create rate limit errors
 * @param {string} message - Error message
 * @returns {ICustomError} Rate limit error object
 */
export const rateLimitError = (message: string = 'Too many requests'): ICustomError => {
  return createError(message, 429);
};

export default ErrorHandler;