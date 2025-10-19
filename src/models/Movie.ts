/**
 * @fileoverview Movie model for MongoDB using Mongoose
 * @description Defines the Movie schema and model with validation, methods, and statistics
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-10-18
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMovie, MovieGenre } from '../types';

/**
 * @interface IMovieDocument
 * @description Movie document interface extending Mongoose Document
 */
export interface IMovieDocument extends IMovie, Document {
  _id: string;
  __v?: number;
  updateRating(newAverage: number, newTotal: number): Promise<void>;
  incrementViews(): Promise<void>;
  isGenreValid(genre: string): boolean;
  getFormattedDuration(): string;
  toSafeObject(): Partial<IMovieDocument>;
}

/**
 * @interface IMovieModel
 * @description Movie model interface with static methods
 */
export interface IMovieModel extends Model<IMovieDocument> {
  searchByTitle(searchTerm: string): Promise<IMovieDocument[]>;
  filterByGenre(genre: MovieGenre | MovieGenre[]): Promise<IMovieDocument[]>;
  getMostPopular(limit?: number): Promise<IMovieDocument[]>;
  getRecentlyAdded(limit?: number): Promise<IMovieDocument[]>;
  getTopRated(limit?: number): Promise<IMovieDocument[]>;
  findActive(): Promise<IMovieDocument[]>;
}

/**
 * @const VALID_GENRES
 * @description List of valid movie genres
 */
const VALID_GENRES: MovieGenre[] = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Fantasy',
  'Mystery',
  'Crime',
  'Documentary',
  'Animation',
  'Family',
];

/**
 * @const VALID_VIDEO_PROVIDERS
 * @description List of valid video providers
 */
const VALID_VIDEO_PROVIDERS = ['cloudinary', 'pexels', 'youtube', 'external'];

/**
 * @const MovieSchema
 * @description Mongoose schema for Movie collection
 */
const MovieSchema = new Schema<IMovieDocument, IMovieModel>(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true, // Index for search performance
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    genre: {
      type: [String],
      required: [true, 'At least one genre is required'],
      validate: {
        validator: function (genres: string[]): boolean {
          if (!Array.isArray(genres) || genres.length === 0) {
            return false;
          }
          return genres.every((g) => VALID_GENRES.includes(g as MovieGenre));
        },
        message: (props: any) =>
          `Invalid genre(s). Valid genres are: ${VALID_GENRES.join(', ')}`,
      },
      index: true, // Index for filtering by genre
    },
    duration: {
      type: Number,
      required: [true, 'Movie duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
      max: [600, 'Duration cannot exceed 600 minutes'],
      validate: {
        validator: Number.isInteger,
        message: 'Duration must be a whole number (in minutes)',
      },
    },
    releaseYear: {
      type: Number,
      required: [true, 'Release year is required'],
      min: [1888, 'Release year cannot be before 1888 (first film)'],
      max: [new Date().getFullYear() + 2, 'Release year cannot be more than 2 years in the future'],
      validate: {
        validator: Number.isInteger,
        message: 'Release year must be a whole number',
      },
    },
    director: {
      type: String,
      trim: true,
      maxlength: [100, 'Director name cannot exceed 100 characters'],
      default: null,
    },
    cast: {
      type: [String],
      default: [],
      validate: {
        validator: function (cast: string[]): boolean {
          return cast.every((actor) => actor.length <= 100);
        },
        message: 'Each cast member name cannot exceed 100 characters',
      },
    },
    poster: {
      type: String,
      required: [true, 'Poster URL is required'],
      trim: true,
      validate: {
        validator: function (url: string): boolean {
          try {
            const urlObj = new URL(url);
            return ['http:', 'https:'].includes(urlObj.protocol);
          } catch {
            return false;
          }
        },
        message: 'Poster must be a valid HTTP/HTTPS URL',
      },
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
      validate: {
        validator: function (url: string): boolean {
          try {
            const urlObj = new URL(url);
            return ['http:', 'https:'].includes(urlObj.protocol);
          } catch {
            return false;
          }
        },
        message: 'Video URL must be a valid HTTP/HTTPS URL',
      },
    },
    videoProvider: {
      type: String,
      enum: {
        values: VALID_VIDEO_PROVIDERS,
        message: 'Video provider must be one of: ' + VALID_VIDEO_PROVIDERS.join(', '),
      },
      default: 'external',
    },
    subtitles: {
      spanish: {
        type: String,
        default: null,
        trim: true,
        validate: {
          validator: function (url: string): boolean {
            if (!url) return true; // Optional field
            try {
              const urlObj = new URL(url);
              return ['http:', 'https:'].includes(urlObj.protocol) && url.endsWith('.vtt');
            } catch {
              return false;
            }
          },
          message: 'Spanish subtitle must be a valid URL ending with .vtt',
        },
      },
      english: {
        type: String,
        default: null,
        trim: true,
        validate: {
          validator: function (url: string): boolean {
            if (!url) return true; // Optional field
            try {
              const urlObj = new URL(url);
              return ['http:', 'https:'].includes(urlObj.protocol) && url.endsWith('.vtt');
            } catch {
              return false;
            }
          },
          message: 'English subtitle must be a valid URL ending with .vtt',
        },
      },
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Average rating cannot be less than 0'],
      max: [5, 'Average rating cannot exceed 5'],
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: [0, 'Total ratings cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Total ratings must be a whole number',
      },
    },
    views: {
      type: Number,
      default: 0,
      min: [0, 'Views cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Views must be a whole number',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Index for filtering active movies
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
 * @description Compound index for search and filter performance
 */
MovieSchema.index({ title: 'text', description: 'text' });
MovieSchema.index({ genre: 1, averageRating: -1 });
MovieSchema.index({ createdAt: -1 });
MovieSchema.index({ averageRating: -1, totalRatings: -1 });
MovieSchema.index({ views: -1 });

/**
 * @method updateRating
 * @description Updates the average rating and total ratings count
 * @param {number} newAverage - New average rating
 * @param {number} newTotal - New total ratings count
 * @returns {Promise<void>}
 */
MovieSchema.methods.updateRating = async function (
  newAverage: number,
  newTotal: number
): Promise<void> {
  this.averageRating = Math.round(newAverage * 10) / 10; // Round to 1 decimal
  this.totalRatings = newTotal;
  await this.save();
};

/**
 * @method incrementViews
 * @description Increments the view counter by 1
 * @returns {Promise<void>}
 */
MovieSchema.methods.incrementViews = async function (): Promise<void> {
  this.views = (this.views || 0) + 1;
  await this.save();
};

/**
 * @method isGenreValid
 * @description Checks if a genre is valid
 * @param {string} genre - Genre to validate
 * @returns {boolean} True if genre is valid
 */
MovieSchema.methods.isGenreValid = function (genre: string): boolean {
  return VALID_GENRES.includes(genre as MovieGenre);
};

/**
 * @method getFormattedDuration
 * @description Returns formatted duration string (e.g., "2h 30m")
 * @returns {string} Formatted duration
 */
MovieSchema.methods.getFormattedDuration = function (): string {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

/**
 * @method toSafeObject
 * @description Returns movie object without sensitive information
 * @returns {Partial<IMovieDocument>} Safe movie object
 */
MovieSchema.methods.toSafeObject = function (): Partial<IMovieDocument> {
  const movieObject = this.toObject();
  return movieObject;
};

/**
 * @static searchByTitle
 * @description Searches movies by title (case-insensitive)
 * @param {string} searchTerm - Search term
 * @returns {Promise<IMovieDocument[]>} Array of matching movies
 */
MovieSchema.statics.searchByTitle = function (searchTerm: string): Promise<IMovieDocument[]> {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    title: regex,
    isActive: true,
  }).sort({ averageRating: -1, title: 1 });
};

/**
 * @static filterByGenre
 * @description Filters movies by genre(s)
 * @param {MovieGenre | MovieGenre[]} genre - Genre or array of genres
 * @returns {Promise<IMovieDocument[]>} Array of matching movies
 */
MovieSchema.statics.filterByGenre = function (
  genre: MovieGenre | MovieGenre[]
): Promise<IMovieDocument[]> {
  const genres = Array.isArray(genre) ? genre : [genre];
  return this.find({
    genre: { $in: genres },
    isActive: true,
  }).sort({ averageRating: -1, title: 1 });
};

/**
 * @static getMostPopular
 * @description Gets most viewed movies
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<IMovieDocument[]>} Array of popular movies
 */
MovieSchema.statics.getMostPopular = function (limit: number = 10): Promise<IMovieDocument[]> {
  return this.find({ isActive: true })
    .sort({ views: -1, averageRating: -1 })
    .limit(limit);
};

/**
 * @static getRecentlyAdded
 * @description Gets recently added movies
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<IMovieDocument[]>} Array of recent movies
 */
MovieSchema.statics.getRecentlyAdded = function (limit: number = 10): Promise<IMovieDocument[]> {
  return this.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * @static getTopRated
 * @description Gets top-rated movies
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<IMovieDocument[]>} Array of top-rated movies
 */
MovieSchema.statics.getTopRated = function (limit: number = 10): Promise<IMovieDocument[]> {
  return this.find({
    isActive: true,
    totalRatings: { $gte: 5 }, // At least 5 ratings to be considered
  })
    .sort({ averageRating: -1, totalRatings: -1 })
    .limit(limit);
};

/**
 * @static findActive
 * @description Finds all active movies
 * @returns {Promise<IMovieDocument[]>} Array of active movies
 */
MovieSchema.statics.findActive = function (): Promise<IMovieDocument[]> {
  return this.find({ isActive: true }).sort({ title: 1 });
};

/**
 * @description Pre-save middleware to validate genre array
 */
MovieSchema.pre<IMovieDocument>('save', function (next) {
  if (this.genre && this.genre.length > 0) {
    // Remove duplicates
    this.genre = [...new Set(this.genre)];
  }
  next();
});

/**
 * @description Pre-save middleware to ensure averageRating is rounded
 */
MovieSchema.pre<IMovieDocument>('save', function (next) {
  if (this.averageRating !== undefined) {
    this.averageRating = Math.round(this.averageRating * 10) / 10;
  }
  next();
});

/**
 * @const Movie
 * @description Movie model
 */
export const Movie = mongoose.model<IMovieDocument, IMovieModel>('Movie', MovieSchema);

export default Movie;
