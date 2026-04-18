import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['subscriber', 'admin'], default: 'subscriber', index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    country: { type: String, trim: true, default: 'GB' },
    phone: { type: String, trim: true },
    selectedCharity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity' },
    charityContributionPercentage: {
      type: Number,
      min: env.minCharityPercentage,
      max: 100,
      default: env.minCharityPercentage
    },
    totalWon: { type: Number, default: 0 },
    isEmailVerified: { type: Boolean, default: false, index: true },
    emailVerifiedAt: Date,
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: Date,
    lastLoginAt: Date
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 12);
};

export const User = mongoose.model('User', userSchema);
