/**
 * @fileoverview Rating model for MongoDB using Mongoose
 * @description Defines the Rating schema for user movie ratings (1-5 stars)
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-10-18
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { IRating } from '../types';

/**
 * @interface IRatingDocument
 * @description Rating document interface extending Mongoose Document
 */
export interface IRatingDocument extends IRating, Document {
  _id: string;
  __v?: number;
  isOwnedBy(userId: string): boolean;
}

/**
 * @interface IRatingModel
 * @description Rating model interface with static methods
 */
export interface IRatingModel extends Model<IRatingDocument> {
  findByUser(userId: string): Promise<IRatingDocument[]>;
  findByMovie(movieId: string): Promise<IRatingDocument[]>;
  getUserRatingForMovie(userId: string, movieId: string): Promise<IRatingDocument | null>;
  getMovieAverageRating(movieId: string): Promise<{ average: number; total: number }>;
  updateMovieRating(movieId: string): Promise<void>;
}

/**
 * @const RatingSchema
 * @description Mongoose schema for Rating collection
 */
const RatingSchema = new Schema<IRatingDocument, IRatingModel>(
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number (1-5)',
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
 * @description Compound unique index to ensure one rating per user per movie
 */
RatingSchema.index({ userId: 1, movieId: 1 }, { unique: true });

/**
 * @description Index for fast user ratings lookup
 */
RatingSchema.index({ userId: 1, createdAt: -1 });

/**
 * @description Index for movie ratings aggregation
 */
RatingSchema.index({ movieId: 1, rating: 1 });

/**
 * @method isOwnedBy
 * @description Checks if the rating belongs to a specific user
 * @param {string} userId - User ID to check ownership
 * @returns {boolean} True if rating belongs to user
 */
RatingSchema.methods.isOwnedBy = function (userId: string): boolean {
  return this.userId.toString() === userId.toString();
};

/**
 * @static findByUser
 * @description Finds all ratings by a specific user
 * @param {string} userId - User ID
 * @returns {Promise<IRatingDocument[]>} Array of user's ratings
 */
RatingSchema.statics.findByUser = function (userId: string): Promise<IRatingDocument[]> {
  return this.find({ userId }).sort({ createdAt: -1 });
};

/**
 * @static findByMovie
 * @description Finds all ratings for a specific movie
 * @param {string} movieId - Movie ID
 * @returns {Promise<IRatingDocument[]>} Array of movie ratings
 */
RatingSchema.statics.findByMovie = function (movieId: string): Promise<IRatingDocument[]> {
  return this.find({ movieId }).sort({ createdAt: -1 });
};

/**
 * @static getUserRatingForMovie
 * @description Gets a user's rating for a specific movie
 * @param {string} userId - User ID
 * @param {string} movieId - Movie ID
 * @returns {Promise<IRatingDocument | null>} Rating or null
 */
RatingSchema.statics.getUserRatingForMovie = function (
  userId: string,
  movieId: string
): Promise<IRatingDocument | null> {
  return this.findOne({ userId, movieId });
};

/**
 * @static getMovieAverageRating
 * @description Calculates average rating and total count for a movie
 * @param {string} movieId - Movie ID
 * @returns {Promise<{average: number, total: number}>} Rating statistics
 */
RatingSchema.statics.getMovieAverageRating = async function (
  movieId: string
): Promise<{ average: number; total: number }> {
  const result = await this.aggregate([
    { $match: { movieId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return { average: 0, total: 0 };
  }

  return {
    average: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
    total: result[0].totalRatings,
  };
};

/**
 * @static updateMovieRating
 * @description Updates the movie's average rating and total count
 * @param {string} movieId - Movie ID
 * @returns {Promise<void>}
 */
RatingSchema.statics.updateMovieRating = async function (movieId: string): Promise<void> {
  try {
    const Movie = mongoose.model('Movie');
    const { average, total } = await this.getMovieAverageRating(movieId);

    await Movie.findByIdAndUpdate(movieId, {
      $set: {
        averageRating: average,
        totalRatings: total,
      },
    });
  } catch (error) {
    console.error(`Failed to update movie rating for ${movieId}:`, error);
    throw error;
  }
};

/**
 * @description Pre-save validation to ensure movie exists
 */
RatingSchema.pre<IRatingDocument>('save', async function (next) {
  try {
    const Movie = mongoose.model('Movie');
    const movie = await Movie.findById(this.movieId);

    if (!movie) {
      const error = new Error('Movie not found');
      (error as any).statusCode = 404;
      return next(error);
    }

    // Check if movie is active
    if (!(movie as any).isActive) {
      const error = new Error('Cannot rate an inactive movie');
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
RatingSchema.pre<IRatingDocument>('save', async function (next) {
  try {
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
 * @description Post-save hook to update movie's average rating
 */
RatingSchema.post<IRatingDocument>('save', async function (doc) {
  try {
    await (this.constructor as IRatingModel).updateMovieRating(doc.movieId);
  } catch (error) {
    console.error('Failed to update movie rating after save:', error);
  }
});

/**
 * @description Post-delete hook to update movie's average rating
 */
RatingSchema.post('findOneAndDelete', async function (doc: IRatingDocument) {
  if (doc) {
    try {
      await Rating.updateMovieRating(doc.movieId);
    } catch (error) {
      console.error('Failed to update movie rating after delete:', error);
    }
  }
});

/**
 * @description Post-update hook to update movie's average rating
 */
RatingSchema.post('findOneAndUpdate', async function (doc: IRatingDocument) {
  if (doc) {
    try {
      await Rating.updateMovieRating(doc.movieId);
    } catch (error) {
      console.error('Failed to update movie rating after update:', error);
    }
  }
});

/**
 * @description Handle unique constraint errors
 */
RatingSchema.post('save', function (error: any, doc: any, next: any) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const customError = new Error('You have already rated this movie');
    (customError as any).code = 11000;
    (customError as any).statusCode = 409;
    next(customError);
  } else {
    next(error);
  }
});

/**
 * @const Rating
 * @description Rating model
 */
export const Rating = mongoose.model<IRatingDocument, IRatingModel>('Rating', RatingSchema);

export default Rating;
