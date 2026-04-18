import { Draw } from '../models/Draw.js';
import { Score } from '../models/Score.js';
import { Subscription } from '../models/Subscription.js';
import { Winner } from '../models/Winner.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const myDashboard = asyncHandler(async (req, res) => {
  const [subscription, scores, winners, drawsEntered, upcomingDraw] = await Promise.all([
    Subscription.findOne({ user: req.user._id }).sort({ createdAt: -1 }).populate('charity'),
    Score.find({ user: req.user._id }).sort({ playedAt: -1 }),
    Winner.find({ user: req.user._id }).populate('draw').sort({ createdAt: -1 }),
    Draw.countDocuments({ status: 'published' }),
    Draw.findOne({ status: { $in: ['draft', 'simulated'] } }).sort({ year: 1, month: 1 })
  ]);

  res.json({
    success: true,
    dashboard: {
      profile: req.user,
      subscription,
      scores,
      selectedCharity: subscription?.charity || req.user.selectedCharity,
      charityContributionPercentage: req.user.charityContributionPercentage,
      participation: { drawsEntered, upcomingDraw },
      winnings: {
        totalWon: req.user.totalWon,
        records: winners,
        pendingPaymentCount: winners.filter((winner) => winner.paymentStatus === 'pending').length
      }
    }
  });
});
