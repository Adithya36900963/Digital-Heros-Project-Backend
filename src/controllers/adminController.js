import { Charity } from '../models/Charity.js';
import { Donation } from '../models/Donation.js';
import { Draw } from '../models/Draw.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { Winner } from '../models/Winner.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate('selectedCharity').sort({ createdAt: -1 });
  res.json({ success: true, users });
});

export const updateUser = asyncHandler(async (req, res) => {
  const allowed = ['name', 'status', 'role', 'selectedCharity', 'charityContributionPercentage', 'country', 'phone'];
  const patch = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
  res.json({ success: true, user });
});

export const analytics = asyncHandler(async (req, res) => {
  const [totalUsers, activeSubscribers, totalPrizePool, charityTotals, drawCount, pendingWinners] = await Promise.all([
    User.countDocuments(),
    Subscription.countDocuments({ status: 'active' }),
    Subscription.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$prizePoolContribution' } } }]),
    Donation.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: '$charity', total: { $sum: '$amount' } } }]),
    Draw.countDocuments({ status: 'published' }),
    Winner.countDocuments({ verificationStatus: 'pending' })
  ]);

  const charities = await Charity.find({ _id: { $in: charityTotals.map((item) => item._id) } }).select('name');
  const charityNameById = new Map(charities.map((charity) => [charity._id.toString(), charity.name]));

  res.json({
    success: true,
    analytics: {
      totalUsers,
      activeSubscribers,
      totalPrizePool: totalPrizePool[0]?.total || 0,
      charityContributionTotals: charityTotals.map((item) => ({
        charityId: item._id,
        charityName: charityNameById.get(item._id.toString()),
        total: item.total
      })),
      drawCount,
      pendingWinners
    }
  });
});
