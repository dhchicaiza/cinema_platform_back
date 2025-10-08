/**
 * @fileoverview Validation middleware for request data
 * @description Provides validation functions for user registration, login, and other operations
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-09-28
 */

import { Request, Response, NextFunction } from 'express';
import { IApiResponse, ValidationError, IUserRegistration, IUserLogin, IUserProfile } from '../types';
import { validationError } from './errorHandler';

/**
 * @class ValidationManager
 * @description Manages validation operations for different data types
 */
class ValidationManager {
  /**
   * @method validateEmail
   * @description Validates email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid email format
   * @static
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * @method validatePassword
   * @description Validates password strength
   * @param {string} password - Password to validate
   * @returns {object} Validation result with isValid and errors
   * @static
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * @method validateAge
   * @description Validates age value
   * @param {number} age - Age to validate
   * @returns {boolean} True if valid age
   * @static
   */
  static validateAge(age: number): boolean {
    return Number.isInteger(age) && age >= 13 && age <= 120;
  }

  /**
   * @method validateName
   * @description Validates name format (first name or last name)
   * @param {string} name - Name to validate
   * @returns {boolean} True if valid name format
   * @static
   */
  static validateName(name: string): boolean {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    return nameRegex.test(name) && name.trim().length >= 2 && name.trim().length <= 50;
  }

  /**
   * @method validateUrl
   * @description Validates URL format
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL format
   * @static
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method sanitizeInput
   * @description Sanitizes input by trimming whitespace and removing dangerous characters
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   * @static
   */
  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * @method validateObjectId
   * @description Validates MongoDB ObjectId format
   * @param {string} id - ID to validate
   * @returns {boolean} True if valid ObjectId format
   * @static
   */
  static validateObjectId(id: string): boolean {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }

  /**
   * @method validateRating
   * @description Validates movie rating (1-5 stars)
   * @param {number} rating - Rating to validate
   * @returns {boolean} True if valid rating
   * @static
   */
  static validateRating(rating: number): boolean {
    return Number.isInteger(rating) && rating >= 1 && rating <= 5;
  }

  /**
   * @method validatePaginationParams
   * @description Validates pagination parameters
   * @param {any} params - Pagination parameters to validate
   * @returns {object} Validation result with sanitized params
   * @static
   */
  static validatePaginationParams(params: any): {
    isValid: boolean;
    errors: string[];
    sanitized: { page: number; limit: number };
  } {
    const errors: string[] = [];
    let page = 1;
    let limit = 10;

    if (params.page !== undefined) {
      const parsedPage = parseInt(params.page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        errors.push('Page must be a positive integer');
      } else {
        page = parsedPage;
      }
    }

    if (params.limit !== undefined) {
      const parsedLimit = parseInt(params.limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        errors.push('Limit must be a positive integer between 1 and 100');
      } else {
        limit = parsedLimit;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: { page, limit },
    };
  }
}

/**
 * @function validateUserRegistration
 * @description Middleware to validate user registration data
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const validateUserRegistration = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const data: IUserRegistration = req.body;
    const errors: ValidationError[] = [];

    // Validate first name
    if (!data.firstName || typeof data.firstName !== 'string') {
      errors.push({ field: 'firstName', message: 'First name is required' });
    } else if (!ValidationManager.validateName(data.firstName)) {
      errors.push({
        field: 'firstName',
        message: 'First name must be 2-50 characters and contain only letters and spaces',
        value: data.firstName,
      });
    }

    // Validate last name
    if (!data.lastName || typeof data.lastName !== 'string') {
      errors.push({ field: 'lastName', message: 'Last name is required' });
    } else if (!ValidationManager.validateName(data.lastName)) {
      errors.push({
        field: 'lastName',
        message: 'Last name must be 2-50 characters and contain only letters and spaces',
        value: data.lastName,
      });
    }

    // Validate email
    if (!data.email || typeof data.email !== 'string') {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!ValidationManager.validateEmail(data.email)) {
      errors.push({
        field: 'email',
        message: 'Please provide a valid email address',
        value: data.email,
      });
    }

    // Validate age
    if (data.age === undefined || data.age === null) {
      errors.push({ field: 'age', message: 'Age is required' });
    } else if (!ValidationManager.validateAge(data.age)) {
      errors.push({
        field: 'age',
        message: 'Age must be between 13 and 120 years',
        value: data.age,
      });
    }

    // Validate password
    if (!data.password || typeof data.password !== 'string') {
      errors.push({ field: 'password', message: 'Password is required' });
    } else {
      const passwordValidation = ValidationManager.validatePassword(data.password);
      if (!passwordValidation.isValid) {
        passwordValidation.errors.forEach(error => {
          errors.push({ field: 'password', message: error });
        });
      }
    }

    // Validate confirm password
    if (!data.confirmPassword || typeof data.confirmPassword !== 'string') {
      errors.push({ field: 'confirmPassword', message: 'Password confirmation is required' });
    } else if (data.password !== data.confirmPassword) {
      errors.push({
        field: 'confirmPassword',
        message: 'Password confirmation does not match password',
      });
    }

    if (errors.length > 0) {
      const response: IApiResponse = {
        success: false,
        message: 'Validation failed',
        error: 'Please check the provided data',
        errors: errors.map(err => `${err.field}: ${err.message}`),
      };
      res.status(422).json(response);
      return;
    }

    // Sanitize data
    req.body.firstName = ValidationManager.sanitizeInput(data.firstName);
    req.body.lastName = ValidationManager.sanitizeInput(data.lastName);
    req.body.email = data.email.toLowerCase().trim();

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @function validateUserLogin
 * @description Middleware to validate user login data
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const validateUserLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const data: IUserLogin = req.body;
    const errors: ValidationError[] = [];

    // Validate email
    if (!data.email || typeof data.email !== 'string') {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!ValidationManager.validateEmail(data.email)) {
      errors.push({
        field: 'email',
        message: 'Please provide a valid email address',
        value: data.email,
      });
    }

    // Validate password
    if (!data.password || typeof data.password !== 'string') {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (data.password.length < 1) {
      errors.push({ field: 'password', message: 'Password cannot be empty' });
    }

    if (errors.length > 0) {
      const response: IApiResponse = {
        success: false,
        message: 'Validation failed',
        error: 'Please check the provided credentials',
        errors: errors.map(err => `${err.field}: ${err.message}`),
      };
      res.status(422).json(response);
      return;
    }

    // Sanitize email
    req.body.email = data.email.toLowerCase().trim();

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @function validateUserProfile
 * @description Middleware to validate user profile update data
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const validateUserProfile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const data: IUserProfile = req.body;
    const errors: ValidationError[] = [];

    // Validate first name (optional)
    if (data.firstName !== undefined) {
      if (typeof data.firstName !== 'string' || !ValidationManager.validateName(data.firstName)) {
        errors.push({
          field: 'firstName',
          message: 'First name must be 2-50 characters and contain only letters and spaces',
          value: data.firstName,
        });
      }
    }

    // Validate last name (optional)
    if (data.lastName !== undefined) {
      if (typeof data.lastName !== 'string' || !ValidationManager.validateName(data.lastName)) {
        errors.push({
          field: 'lastName',
          message: 'Last name must be 2-50 characters and contain only letters and spaces',
          value: data.lastName,
        });
      }
    }

    // Validate email (optional)
    if (data.email !== undefined) {
      if (typeof data.email !== 'string' || !ValidationManager.validateEmail(data.email)) {
        errors.push({
          field: 'email',
          message: 'Please provide a valid email address',
          value: data.email,
        });
      }
    }

    // Validate age (optional)
    if (data.age !== undefined) {
      if (!ValidationManager.validateAge(data.age)) {
        errors.push({
          field: 'age',
          message: 'Age must be between 13 and 120 years',
          value: data.age,
        });
      }
    }

    // Validate avatar URL (optional)
    if (data.avatar !== undefined && data.avatar !== null) {
      if (typeof data.avatar !== 'string' || !ValidationManager.validateUrl(data.avatar)) {
        errors.push({
          field: 'avatar',
          message: 'Avatar must be a valid URL',
          value: data.avatar,
        });
      }
    }

    if (errors.length > 0) {
      const response: IApiResponse = {
        success: false,
        message: 'Validation failed',
        error: 'Please check the provided data',
        errors: errors.map(err => `${err.field}: ${err.message}`),
      };
      res.status(422).json(response);
      return;
    }

    // Sanitize data
    if (data.firstName) {
      req.body.firstName = ValidationManager.sanitizeInput(data.firstName);
    }
    if (data.lastName) {
      req.body.lastName = ValidationManager.sanitizeInput(data.lastName);
    }
    if (data.email) {
      req.body.email = data.email.toLowerCase().trim();
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @function validateObjectId
 * @description Middleware to validate MongoDB ObjectId in request parameters
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} Middleware function
 */
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = req.params[paramName];

      if (!id) {
        const response: IApiResponse = {
          success: false,
          message: `${paramName} parameter is required`,
          error: 'Missing required parameter',
        };
        res.status(400).json(response);
        return;
      }

      if (!ValidationManager.validateObjectId(id)) {
        const response: IApiResponse = {
          success: false,
          message: `Invalid ${paramName} format`,
          error: 'Please provide a valid ID',
        };
        res.status(400).json(response);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * @function validateRating
 * @description Middleware to validate movie rating data
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const validateRating = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { rating } = req.body;

    if (rating === undefined || rating === null) {
      const response: IApiResponse = {
        success: false,
        message: 'Rating is required',
        error: 'Please provide a rating between 1 and 5 stars',
      };
      res.status(422).json(response);
      return;
    }

    if (!ValidationManager.validateRating(rating)) {
      const response: IApiResponse = {
        success: false,
        message: 'Invalid rating value',
        error: 'Rating must be an integer between 1 and 5',
      };
      res.status(422).json(response);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @function validatePagination
 * @description Middleware to validate pagination query parameters
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const validation = ValidationManager.validatePaginationParams(req.query);

    if (!validation.isValid) {
      const response: IApiResponse = {
        success: false,
        message: 'Invalid pagination parameters',
        error: 'Please check your pagination parameters',
        errors: validation.errors,
      };
      res.status(400).json(response);
      return;
    }

    // Add sanitized pagination params to request
    req.query.page = validation.sanitized.page.toString();
    req.query.limit = validation.sanitized.limit.toString();

    next();
  } catch (error) {
    next(error);
  }
};

export { ValidationManager };
export default ValidationManager;