import { Charity } from '../models/Charity.js';
import { Donation } from '../models/Donation.js';
import { Draw } from '../models/Draw.js';
import { LoginHistory } from '../models/LoginHistory.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { Winner } from '../models/Winner.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate('selectedCharity').sort({ createdAt: -1 });
  res.json({ success: true, users });
});

export const listSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find()
    .populate('user', 'name email role status')
    .populate('charity')
    .sort({ createdAt: -1 });

  res.json({ success: true, subscriptions });
});

export const listLoginHistory = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const filter = {};

  if (req.query.userId) {
    const userId = String(req.query.userId);
    if (!/^[a-f\d]{24}$/i.test(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId filter' });
    }
    filter.user = userId;
  }
  if (req.query.email) filter.userEmail = String(req.query.email).toLowerCase();

  const logins = await LoginHistory.find(filter)
    .populate('user', 'name email role status')
    .sort({ loginAt: -1 })
    .limit(limit);

  res.json({ success: true, logins });
});

export const updateSubscription = asyncHandler(async (req, res) => {
  const allowed = ['status', 'currentPeriodEnd'];
  const patch = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  }

  if (patch.currentPeriodEnd) patch.currentPeriodEnd = new Date(patch.currentPeriodEnd);

  const subscription = await Subscription.findByIdAndUpdate(req.params.id, patch, {
    new: true,
    runValidators: true
  }).populate('user', 'name email').populate('charity');

  res.json({ success: true, subscription });
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
