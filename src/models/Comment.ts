/**
 * @fileoverview Comment Model - Mongoose schema for movie comments
 * @description Defines the Comment schema and model for user comments on movies
 * @module models/Comment
 * @version 1.0.0
 * @since 1.0.0
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { IComment } from '../types';

/**
 * @interface ICommentDocument
 * @extends {Document}
 * @extends {IComment}
 * @description Extended Comment interface with Mongoose Document methods
 */
export interface ICommentDocument extends IComment, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @const commentSchema
 * @description Mongoose schema for Comment model
 * @type {Schema<ICommentDocument>}
 */
const commentSchema: Schema<ICommentDocument> = new Schema(
  {
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
      validate: {
        validator: function (userId: string): boolean {
          return /^[0-9a-fA-F]{24}$/.test(userId);
        },
        message: 'User ID must be a valid MongoDB ObjectId',
      },
    },
    movieId: {
      type: String,
      ref: 'Movie',
      required: [true, 'Movie ID is required'],
      index: true,
      validate: {
        validator: function (movieId: string): boolean {
          return /^[0-9a-fA-F]{24}$/.test(movieId);
        },
        message: 'Movie ID must be a valid MongoDB ObjectId',
      },
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      minlength: [1, 'Comment must be at least 1 character long'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true,
    },
    edited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * @index
 * @description Compound index for efficient queries by movie
 */
commentSchema.index({ movieId: 1, createdAt: -1 });

/**
 * @index
 * @description Index for user comments
 */
commentSchema.index({ userId: 1, createdAt: -1 });

/**
 * @method toJSON
 * @description Custom JSON serialization to exclude sensitive data
 */
commentSchema.methods.toJSON = function (): Partial<ICommentDocument> {
  const comment = this.toObject();
  return comment;
};

/**
 * @static getMovieComments
 * @description Get all comments for a specific movie with pagination
 * @param {string} movieId - Movie ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Comments per page (default: 20)
 * @returns {Promise<{comments: ICommentDocument[], total: number, pages: number}>}
 */
commentSchema.statics.getMovieComments = async function (
  movieId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  comments: ICommentDocument[];
  total: number;
  page: number;
  pages: number;
}> {
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    this.find({ movieId })
      .populate('userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments({ movieId }),
  ]);

  return {
    comments,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * @static getUserComments
 * @description Get all comments by a specific user
 * @param {string} userId - User ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Comments per page (default: 20)
 * @returns {Promise<{comments: ICommentDocument[], total: number, pages: number}>}
 */
commentSchema.statics.getUserComments = async function (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  comments: ICommentDocument[];
  total: number;
  page: number;
  pages: number;
}> {
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    this.find({ userId })
      .populate('movieId', 'title poster')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments({ userId }),
  ]);

  return {
    comments,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * @static deleteMovieComments
 * @description Delete all comments for a specific movie (cascade delete)
 * @param {string} movieId - Movie ID
 * @returns {Promise<{deletedCount: number}>}
 */
commentSchema.statics.deleteMovieComments = async function (
  movieId: string
): Promise<{ deletedCount: number }> {
  const result = await this.deleteMany({ movieId });
  return { deletedCount: result.deletedCount || 0 };
};

/**
 * @interface ICommentModel
 * @extends {Model<ICommentDocument>}
 * @description Comment model interface with static methods
 */
interface ICommentModel extends Model<ICommentDocument> {
  getMovieComments(
    movieId: string,
    page?: number,
    limit?: number
  ): Promise<{
    comments: ICommentDocument[];
    total: number;
    page: number;
    pages: number;
  }>;
  getUserComments(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<{
    comments: ICommentDocument[];
    total: number;
    page: number;
    pages: number;
  }>;
  deleteMovieComments(movieId: string): Promise<{ deletedCount: number }>;
}

/**
 * @const Comment
 * @description Mongoose model for Comment
 * @type {ICommentModel}
 */
const Comment: ICommentModel = mongoose.model<ICommentDocument, ICommentModel>(
  'Comment',
  commentSchema
);

export default Comment;
