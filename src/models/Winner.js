import mongoose from 'mongoose';

const winnerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    draw: { type: mongoose.Schema.Types.ObjectId, ref: 'Draw', required: true, index: true },
    matchType: { type: String, enum: ['5-match', '4-match', '3-match'], required: true },
    matchedNumbers: [Number],
    prizeAmount: { type: Number, required: true },
    proof: {
      url: String,
      uploadedAt: Date
    },
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'approved', 'rejected'],
      default: 'not_submitted',
      index: true
    },
    verificationNote: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending', index: true },
    paidAt: Date
  },
  { timestamps: true }
);

winnerSchema.index({ user: 1, draw: 1, matchType: 1 }, { unique: true });

export const Winner = mongoose.model('Winner', winnerSchema);
