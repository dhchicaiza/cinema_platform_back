/**
 * @fileoverview Favorite model for MongoDB using Mongoose
 * @description Defines the Favorite schema for user-movie relationships
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-10-18
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { IFavorite } from '../types';

/**
 * @interface IFavoriteDocument
 * @description Favorite document interface extending Mongoose Document
 */
export interface IFavoriteDocument extends IFavorite, Document {
  _id: string;
  __v?: number;
  isOwnedBy(userId: string): boolean;
}

/**
 * @interface IFavoriteModel
 * @description Favorite model interface with static methods
 */
export interface IFavoriteModel extends Model<IFavoriteDocument> {
  findByUser(userId: string): Promise<IFavoriteDocument[]>;
  findByMovie(movieId: string): Promise<IFavoriteDocument[]>;
  checkFavorite(userId: string, movieId: string): Promise<boolean>;
  getFavoriteCount(movieId: string): Promise<number>;
  getUserFavoritesCount(userId: string): Promise<number>;
}

/**
 * @const FavoriteSchema
 * @description Mongoose schema for Favorite collection
 */
const FavoriteSchema = new Schema<IFavoriteDocument, IFavoriteModel>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
      validate: {
        validator: function (userId: string): boolean {
          return /^[0-9a-fA-F]{24}$/.test(userId);
        },
        message: 'User ID must be a valid MongoDB ObjectId',
      },
    },
    movieId: {
      type: String,
      required: [true, 'Movie ID is required'],
      ref: 'Movie',
      validate: {
        validator: function (movieId: string): boolean {
          return /^[0-9a-fA-F]{24}$/.test(movieId);
        },
        message: 'Movie ID must be a valid MongoDB ObjectId',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

/**
 * @description Compound unique index to prevent duplicate favorites
 * One user can only favorite a movie once
 */
FavoriteSchema.index({ userId: 1, movieId: 1 }, { unique: true });

/**
 * @description Index for fast user favorites lookup
 */
FavoriteSchema.index({ userId: 1, createdAt: -1 });

/**
 * @description Index for movie favorites count
 */
FavoriteSchema.index({ movieId: 1 });

/**
 * @method isOwnedBy
 * @description Checks if the favorite belongs to a specific user
 * @param {string} userId - User ID to check ownership
 * @returns {boolean} True if favorite belongs to user
 */
FavoriteSchema.methods.isOwnedBy = function (userId: string): boolean {
  return this.userId.toString() === userId.toString();
};

/**
 * @static findByUser
 * @description Finds all favorites for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<IFavoriteDocument[]>} Array of user's favorites
 */
FavoriteSchema.statics.findByUser = function (userId: string): Promise<IFavoriteDocument[]> {
  return this.find({ userId }).sort({ createdAt: -1 });
};

/**
 * @static findByMovie
 * @description Finds all users who favorited a specific movie
 * @param {string} movieId - Movie ID
 * @returns {Promise<IFavoriteDocument[]>} Array of favorites for the movie
 */
FavoriteSchema.statics.findByMovie = function (movieId: string): Promise<IFavoriteDocument[]> {
  return this.find({ movieId }).sort({ createdAt: -1 });
};

/**
 * @static checkFavorite
 * @description Checks if a user has favorited a specific movie
 * @param {string} userId - User ID
 * @param {string} movieId - Movie ID
 * @returns {Promise<boolean>} True if favorited
 */
FavoriteSchema.statics.checkFavorite = async function (
  userId: string,
  movieId: string
): Promise<boolean> {
  const favorite = await this.findOne({ userId, movieId });
  return favorite !== null;
};

/**
 * @static getFavoriteCount
 * @description Gets the total number of favorites for a movie
 * @param {string} movieId - Movie ID
 * @returns {Promise<number>} Number of favorites
 */
FavoriteSchema.statics.getFavoriteCount = function (movieId: string): Promise<number> {
  return this.countDocuments({ movieId });
};

/**
 * @static getUserFavoritesCount
 * @description Gets the total number of favorites for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of favorites
 */
FavoriteSchema.statics.getUserFavoritesCount = function (userId: string): Promise<number> {
  return this.countDocuments({ userId });
};

/**
 * @description Pre-save validation to ensure movie exists
 */
FavoriteSchema.pre<IFavoriteDocument>('save', async function (next) {
  try {
    // Import Movie model dynamically to avoid circular dependency
    const Movie = mongoose.model('Movie');
    const movie = await Movie.findById(this.movieId);

    if (!movie) {
      const error = new Error('Movie not found');
      (error as any).statusCode = 404;
      return next(error);
    }

    // Check if movie is active
    if (!(movie as any).isActive) {
      const error = new Error('Cannot favorite an inactive movie');
      (error as any).statusCode = 400;
      return next(error);
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * @description Pre-save validation to ensure user exists
 */
FavoriteSchema.pre<IFavoriteDocument>('save', async function (next) {
  try {
    // Import User model dynamically to avoid circular dependency
    const User = mongoose.model('User');
    const user = await User.findById(this.userId);

    if (!user) {
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      return next(error);
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * @description Handle unique constraint errors
 */
FavoriteSchema.post('save', function (error: any, doc: any, next: any) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const customError = new Error('Movie already in favorites');
    (customError as any).code = 11000;
    (customError as any).statusCode = 409;
    next(customError);
  } else {
    next(error);
  }
});

/**
 * @const Favorite
 * @description Favorite model
 */
export const Favorite = mongoose.model<IFavoriteDocument, IFavoriteModel>(
  'Favorite',
  FavoriteSchema
);

export default Favorite;
