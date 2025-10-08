/**
 * @fileoverview User model for MongoDB using Mongoose
 * @description Defines the User schema and model with validation and methods
 * @version 1.0.0
 * @author Movies Platform Team
 * @since 2025-09-28
 */

import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

/**
 * @interface IUserDocument
 * @description User document interface extending Mongoose Document
 */
export interface IUserDocument extends IUser, Document {
  _id: string;
  __v?: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  isPasswordResetTokenValid(token: string): boolean;
  getFullName(): string;
  toSafeObject(): Partial<IUserDocument>;
}

/**
 * @const UserSchema
 * @description Mongoose schema for User collection
 */
const UserSchema = new Schema<IUserDocument>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters long'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
      match: [/^[a-zA-ZÀ-ÿ\s]+$/, 'First name can only contain letters and spaces'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters long'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
      match: [/^[a-zA-ZÀ-ÿ\s]+$/, 'Last name can only contain letters and spaces'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in queries by default
      validate: {
        validator: function (password: string): boolean {
          // Password must contain at least one uppercase, one lowercase, and one number
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      },
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [13, 'Age must be at least 13 years old'],
      max: [120, 'Age cannot exceed 120 years'],
      validate: {
        validator: Number.isInteger,
        message: 'Age must be a whole number',
      },
    },
    avatar: {
      type: String,
      default: null,
      validate: {
        validator: function (url: string): boolean {
          if (!url) return true; // Optional field
          // Basic URL validation
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Avatar must be a valid URL',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        if (ret.password) delete ret.password;
        if (ret.passwordResetToken) delete ret.passwordResetToken;
        if (ret.passwordResetExpires) delete ret.passwordResetExpires;
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
 * @description Pre-save middleware to hash password
 */
UserSchema.pre<IUserDocument>('save', async function (next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    this.password = await bcrypt.hash(this.password!, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * @description Pre-save middleware to validate email uniqueness
 */
UserSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('email')) {
    return next();
  }

  try {
    const existingUser = await mongoose.model('User').findOne({
      email: this.email,
      _id: { $ne: this._id },
    });

    if (existingUser) {
      const error = new Error('Email already exists');
      (error as any).code = 11000;
      return next(error);
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * @method comparePassword
 * @description Compares provided password with hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * @method generatePasswordResetToken
 * @description Generates a password reset token
 * @returns {string} Password reset token
 */
UserSchema.methods.generatePasswordResetToken = function (): string {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to passwordResetToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (1 hour)
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

  return resetToken;
};

/**
 * @method isPasswordResetTokenValid
 * @description Checks if password reset token is valid
 * @param {string} token - Token to validate
 * @returns {boolean} True if token is valid
 */
UserSchema.methods.isPasswordResetTokenValid = function (token: string): boolean {
  const crypto = require('crypto');
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return (
    this.passwordResetToken === hashedToken &&
    this.passwordResetExpires &&
    this.passwordResetExpires > new Date()
  );
};

/**
 * @method getFullName
 * @description Returns user's full name
 * @returns {string} Full name
 */
UserSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

/**
 * @method toSafeObject
 * @description Returns user object without sensitive information
 * @returns {Partial<IUserDocument>} Safe user object
 */
UserSchema.methods.toSafeObject = function (): Partial<IUserDocument> {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

/**
 * @description Index for email field (unique)
 */
UserSchema.index({ email: 1 }, { unique: true });

/**
 * @description Index for active users
 */
UserSchema.index({ isActive: 1 });

/**
 * @description Compound index for full name search
 */
UserSchema.index({ firstName: 1, lastName: 1 });

/**
 * @description Static method to find active users
 */
UserSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

/**
 * @description Static method to find user by email
 */
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

/**
 * @description Static method to search users by name
 */
UserSchema.statics.searchByName = function (searchTerm: string) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { firstName: regex },
      { lastName: regex },
    ],
    isActive: true,
  });
};

/**
 * @description Handle unique constraint errors
 */
UserSchema.post('save', function (error: any, doc: any, next: any) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    if (error.keyPattern && error.keyPattern.email) {
      const customError = new Error('Email address already exists');
      (customError as any).code = 11000;
      (customError as any).field = 'email';
      next(customError);
    } else {
      next(error);
    }
  } else {
    next(error);
  }
});

/**
 * @const User
 * @description User model
 */
export const User = mongoose.model<IUserDocument>('User', UserSchema);

export default User;