import mongoose from 'mongoose';

const prizeTierSchema = new mongoose.Schema(
  {
    matchType: { type: String, enum: ['5-match', '4-match', '3-match'], required: true },
    poolSharePercentage: { type: Number, required: true },
    poolAmount: { type: Number, default: 0 },
    winnerCount: { type: Number, default: 0 },
    prizePerWinner: { type: Number, default: 0 },
    rolloverAmount: { type: Number, default: 0 }
  },
  { _id: false }
);

const drawSchema = new mongoose.Schema(
  {
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'simulated', 'published'], default: 'draft', index: true },
    logic: { type: String, enum: ['random', 'algorithmic'], default: 'random' },
    winningNumbers: [{ type: Number, min: 1, max: 45 }],
    activeSubscriberCount: { type: Number, default: 0 },
    totalPrizePool: { type: Number, default: 0 },
    jackpotRolloverIn: { type: Number, default: 0 },
    jackpotRolloverOut: { type: Number, default: 0 },
    tiers: [prizeTierSchema],
    publishedAt: Date,
    runBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

drawSchema.index({ month: 1, year: 1 }, { unique: true });

export const Draw = mongoose.model('Draw', drawSchema);
