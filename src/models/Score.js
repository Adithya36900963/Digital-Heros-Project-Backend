import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    value: { type: Number, min: 1, max: 45, required: true },
    playedAt: { type: Date, required: true },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

scoreSchema.index({ user: 1, playedAt: 1 }, { unique: true });

export const Score = mongoose.model('Score', scoreSchema);
