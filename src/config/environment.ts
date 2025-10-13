/**
 * @fileoverview Environment configuration and validation
 * @description Manages environment variables and application configuration
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-09-28
 */

import dotenv from 'dotenv';
import { Environment } from '../types';

// Load environment variables from .env file
dotenv.config();

/**
 * @interface IEnvironmentConfig
 * @description Interface for environment configuration
 */
interface IEnvironmentConfig {
  // Server Configuration
  nodeEnv: Environment;
  port: number;
  apiBaseUrl: string;

  // Database Configuration
  mongodbUri: string;

  // Authentication Configuration
  jwtSecret: string;
  jwtExpiresIn: string | number;
  bcryptSaltRounds: number;

  // Email Configuration
  emailService: string;
  emailUser: string;
  emailPassword: string;

  // Cloudinary Configuration
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;

  // CORS Configuration
  frontendUrl: string;

  // Rate Limiting Configuration
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

/**
 * @class EnvironmentManager
 * @description Manages environment variables validation and configuration
 */
class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: IEnvironmentConfig;

  /**
   * @constructor
   * @description Private constructor for singleton pattern
   */
  private constructor() {
    this.config = this.loadAndValidateConfig();
  }

  /**
   * @method getInstance
   * @description Returns singleton instance of EnvironmentManager
   * @returns {EnvironmentManager} Singleton instance
   * @static
   */
  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * @method loadAndValidateConfig
   * @description Loads and validates environment variables
   * @returns {IEnvironmentConfig} Validated configuration object
   * @private
   * @throws {Error} When required environment variables are missing
   */
  private loadAndValidateConfig(): IEnvironmentConfig {
    const requiredVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ];

    // Check for required environment variables
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
      );
    }

    // Parse and validate configuration
    const config: IEnvironmentConfig = {
      // Server Configuration
      nodeEnv: this.validateEnvironment(process.env.NODE_ENV),
      port: this.parseNumber(process.env.PORT, 5000),
      apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${this.parseNumber(process.env.PORT, 5000)}`,

      // Database Configuration
      mongodbUri: process.env.MONGODB_URI!,

      // Authentication Configuration
      jwtSecret: process.env.JWT_SECRET!,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      bcryptSaltRounds: this.parseNumber(process.env.BCRYPT_SALT_ROUNDS, 12),

      // Email Configuration
      emailService: process.env.EMAIL_SERVICE || 'gmail',
      emailUser: process.env.EMAIL_USER!,
      emailPassword: process.env.EMAIL_PASSWORD!,

      // Cloudinary Configuration
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      cloudinaryApiKey: process.env.CLOUDINARY_API_KEY!,
      cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET!,

      // CORS Configuration
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

      // Rate Limiting Configuration
      rateLimitWindowMs: this.parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000), // 15 minutes
      rateLimitMaxRequests: this.parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    };

    // Validate configuration
    this.validateConfig(config);

    return config;
  }

  /**
   * @method validateEnvironment
   * @description Validates and returns environment type
   * @param {string} env - Environment string
   * @returns {Environment} Validated environment
   * @private
   */
  private validateEnvironment(env: string | undefined): Environment {
    const validEnvironments: Environment[] = ['development', 'production', 'test'];
    const environment = (env || 'development') as Environment;

    if (!validEnvironments.includes(environment)) {
      console.warn(`Invalid NODE_ENV: ${env}. Defaulting to 'development'`);
      return 'development';
    }

    return environment;
  }

  /**
   * @method parseNumber
   * @description Parses string to number with fallback
   * @param {string} value - String value to parse
   * @param {number} fallback - Fallback value
   * @returns {number} Parsed number or fallback
   * @private
   */
  private parseNumber(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * @method validateConfig
   * @description Validates configuration values
   * @param {IEnvironmentConfig} config - Configuration to validate
   * @private
   * @throws {Error} When configuration is invalid
   */
  private validateConfig(config: IEnvironmentConfig): void {
    // Validate port range
    if (config.port < 1 || config.port > 65535) {
      throw new Error(`Invalid port number: ${config.port}. Must be between 1 and 65535.`);
    }

    // Validate JWT secret length
    if (config.jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long for security.');
    }

    // Validate bcrypt salt rounds
    if (config.bcryptSaltRounds < 10 || config.bcryptSaltRounds > 15) {
      throw new Error('BCRYPT_SALT_ROUNDS must be between 10 and 15.');
    }

    // Validate email user (can be email or SMTP username)
    // For SMTP services like Mailtrap, username may not be an email format
    if (config.emailService !== 'smtp') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(config.emailUser)) {
        throw new Error(`Invalid email format: ${config.emailUser}`);
      }
    }

    // Validate rate limiting values
    if (config.rateLimitWindowMs < 60000) {
      throw new Error('RATE_LIMIT_WINDOW_MS must be at least 60000ms (1 minute).');
    }

    if (config.rateLimitMaxRequests < 1) {
      throw new Error('RATE_LIMIT_MAX_REQUESTS must be at least 1.');
    }
  }

  /**
   * @method getConfig
   * @description Returns validated configuration object
   * @returns {IEnvironmentConfig} Configuration object
   */
  public getConfig(): IEnvironmentConfig {
    return { ...this.config };
  }

  /**
   * @method get
   * @description Gets specific configuration value
   * @template K
   * @param {K} key - Configuration key
   * @returns {IEnvironmentConfig[K]} Configuration value
   */
  public get<K extends keyof IEnvironmentConfig>(key: K): IEnvironmentConfig[K] {
    return this.config[key];
  }

  /**
   * @method isDevelopment
   * @description Checks if application is running in development mode
   * @returns {boolean} True if development environment
   */
  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  /**
   * @method isProduction
   * @description Checks if application is running in production mode
   * @returns {boolean} True if production environment
   */
  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  /**
   * @method isTest
   * @description Checks if application is running in test mode
   * @returns {boolean} True if test environment
   */
  public isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  /**
   * @method printConfig
   * @description Prints configuration to console (excluding sensitive data)
   */
  public printConfig(): void {
    const safeConfig = {
      nodeEnv: this.config.nodeEnv,
      port: this.config.port,
      apiBaseUrl: this.config.apiBaseUrl,
      jwtExpiresIn: this.config.jwtExpiresIn,
      bcryptSaltRounds: this.config.bcryptSaltRounds,
      emailService: this.config.emailService,
      emailUser: this.config.emailUser,
      frontendUrl: this.config.frontendUrl,
      rateLimitWindowMs: this.config.rateLimitWindowMs,
      rateLimitMaxRequests: this.config.rateLimitMaxRequests,
      // Sensitive data masked
      mongodbUri: this.maskSensitiveData(this.config.mongodbUri),
      jwtSecret: '***MASKED***',
      emailPassword: '***MASKED***',
      cloudinaryCloudName: this.config.cloudinaryCloudName,
      cloudinaryApiKey: this.maskSensitiveData(this.config.cloudinaryApiKey),
      cloudinaryApiSecret: '***MASKED***',
    };

    console.log('📋 Application Configuration:');
    console.table(safeConfig);
  }

  /**
   * @method maskSensitiveData
   * @description Masks sensitive data for logging
   * @param {string} data - Data to mask
   * @returns {string} Masked data
   * @private
   */
  private maskSensitiveData(data: string): string {
    if (data.length <= 8) {
      return '***MASKED***';
    }
    return `${data.substring(0, 4)}***${data.substring(data.length - 4)}`;
  }
}

// Export singleton instance
export const environment = EnvironmentManager.getInstance();

// Export configuration object for convenience
export const config = environment.getConfig();

export default environment;