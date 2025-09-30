/**
 * @fileoverview MongoDB database connection configuration
 * @description Handles MongoDB Atlas connection setup and configuration
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-09-28
 */

import mongoose from 'mongoose';
import { Environment } from '../types';

/**
 * @interface IDatabaseConfig
 * @description Interface for database configuration options
 */
interface IDatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

/**
 * @class DatabaseManager
 * @description Manages MongoDB database connections and configuration
 */
class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnected: boolean = false;

  /**
   * @constructor
   * @description Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * @method getInstance
   * @description Returns singleton instance of DatabaseManager
   * @returns {DatabaseManager} Singleton instance
   * @static
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * @method getConnectionConfig
   * @description Gets database connection configuration based on environment
   * @param {Environment} environment - Application environment
   * @returns {IDatabaseConfig} Database configuration object
   * @private
   */
  private getConnectionConfig(environment: Environment): IDatabaseConfig {
    const baseOptions: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
    };

    switch (environment) {
      case 'production':
        return {
          uri: process.env.MONGODB_URI!,
          options: {
            ...baseOptions,
            maxPoolSize: 20,
            bufferCommands: false,
          },
        };
      case 'test':
        return {
          uri: process.env.MONGODB_TEST_URI || process.env.MONGODB_URI!,
          options: {
            ...baseOptions,
            maxPoolSize: 5,
          },
        };
      default: // development
        return {
          uri: process.env.MONGODB_URI!,
          options: baseOptions,
        };
    }
  }

  /**
   * @method connect
   * @description Establishes connection to MongoDB Atlas
   * @param {Environment} environment - Application environment
   * @returns {Promise<void>}
   * @throws {Error} When connection fails or MONGODB_URI is not set
   */
  public async connect(environment: Environment = 'development'): Promise<void> {
    try {
      if (this.isConnected) {
        console.log('📊 Database already connected');
        return;
      }

      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      const config = this.getConnectionConfig(environment);

      // Set up mongoose connection event listeners
      this.setupEventListeners();

      // Connect to MongoDB
      await mongoose.connect(config.uri, config.options);

      this.isConnected = true;
      console.log('✅ Successfully connected to MongoDB Atlas');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`🌍 Environment: ${environment}`);
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * @method disconnect
   * @description Closes connection to MongoDB
   * @returns {Promise<void>}
   */
  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        console.log('📊 Database already disconnected');
        return;
      }

      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ Successfully disconnected from MongoDB');
    } catch (error) {
      console.error('❌ MongoDB disconnection error:', error);
      throw error;
    }
  }

  /**
   * @method setupEventListeners
   * @description Sets up MongoDB connection event listeners
   * @private
   */
  private setupEventListeners(): void {
    // Connection successful
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
    });

    // Connection error
    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error);
      this.isConnected = false;
    });

    // Connection disconnected
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Application termination
    process.on('SIGINT', async () => {
      try {
        await this.disconnect();
        console.log('🛑 MongoDB connection closed due to application termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
  }

  /**
   * @method getConnectionStatus
   * @description Returns current connection status
   * @returns {boolean} Connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * @method getConnectionInfo
   * @description Returns connection information
   * @returns {object} Connection information object
   */
  public getConnectionInfo(): {
    isConnected: boolean;
    readyState: number;
    host?: string;
    port?: number;
    name?: string;
  } {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }

  /**
   * @method healthCheck
   * @description Performs database health check
   * @returns {Promise<boolean>} Health check result
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      // Perform a simple ping to check connection
      await mongoose.connection.db?.admin().ping();
      return true;
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return false;
    }
  }

  /**
   * @method dropDatabase
   * @description Drops the current database (for testing purposes only)
   * @returns {Promise<void>}
   * @warning Use only in test environment
   */
  public async dropDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production environment');
    }

    try {
      if (this.isConnected && mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
        console.log('🗑️ Database dropped successfully');
      }
    } catch (error) {
      console.error('❌ Error dropping database:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const database = DatabaseManager.getInstance();

/**
 * @function connectToDatabase
 * @description Convenience function to connect to database
 * @param {Environment} environment - Application environment
 * @returns {Promise<void>}
 */
export const connectToDatabase = async (environment: Environment = 'development'): Promise<void> => {
  return database.connect(environment);
};

/**
 * @function disconnectFromDatabase
 * @description Convenience function to disconnect from database
 * @returns {Promise<void>}
 */
export const disconnectFromDatabase = async (): Promise<void> => {
  return database.disconnect();
};

export default database;