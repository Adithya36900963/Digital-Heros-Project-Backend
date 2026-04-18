import mongoose from 'mongoose';

const charitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, trim: true, index: true },
    country: { type: String, trim: true, default: 'GB', index: true },
    websiteUrl: String,
    imageUrls: [String],
    upcomingEvents: [
      {
        title: String,
        startsAt: Date,
        location: String,
        url: String
      }
    ],
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    totalContributed: { type: Number, default: 0 }
  },
  { timestamps: true }
);

charitySchema.index({ name: 'text', description: 'text', category: 'text' });

export const Charity = mongoose.model('Charity', charitySchema);
