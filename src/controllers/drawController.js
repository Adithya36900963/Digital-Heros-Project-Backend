import { Draw } from '../models/Draw.js';
import { Winner } from '../models/Winner.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPrizeTiers, createWinnersForDraw, findEligibleEntries, generateWinningNumbers } from '../services/drawEngine.js';
import { calculateMonthlyPrizePool } from '../services/prizePoolService.js';
import { sendEmail } from '../services/emailService.js';
import { User } from '../models/User.js';

async function prepareDraw({ month, year, logic }) {
  const winningNumbers = await generateWinningNumbers(logic);
  const entries = await findEligibleEntries({ winningNumbers, month, year });
  const matchBuckets = {
    '5-match': entries.filter((entry) => entry.matchCount >= 5),
    '4-match': entries.filter((entry) => entry.matchCount === 4),
    '3-match': entries.filter((entry) => entry.matchCount === 3)
  };
  const pool = await calculateMonthlyPrizePool(month, year);
  const tiers = buildPrizeTiers({ ...pool, matchBuckets });

  return {
    winningNumbers,
    entries,
    tiers,
    activeSubscriberCount: pool.activeSubscriberCount,
    totalPrizePool: pool.totalPrizePool,
    jackpotRolloverIn: pool.jackpotRolloverIn,
    jackpotRolloverOut: tiers.find((tier) => tier.matchType === '5-match')?.rolloverAmount || 0
  };
}

export const listDraws = asyncHandler(async (req, res) => {
  const draws = await Draw.find().sort({ year: -1, month: -1 });
  res.json({ success: true, draws });
});

export const getDraw = asyncHandler(async (req, res) => {
  const draw = await Draw.findById(req.validated.params.id);
  if (!draw) throw new ApiError(404, 'Draw not found');
  const winners = await Winner.find({ draw: draw._id }).populate('user', 'name email');
  res.json({ success: true, draw, winners });
});

export const simulateDraw = asyncHandler(async (req, res) => {
  const { month, year, logic } = req.validated.body;
  const prepared = await prepareDraw({ month, year, logic });

  const draw = await Draw.findOneAndUpdate(
    { month, year },
    {
      month,
      year,
      logic,
      status: 'simulated',
      winningNumbers: prepared.winningNumbers,
      activeSubscriberCount: prepared.activeSubscriberCount,
      totalPrizePool: prepared.totalPrizePool,
      jackpotRolloverIn: prepared.jackpotRolloverIn,
      jackpotRolloverOut: prepared.jackpotRolloverOut,
      tiers: prepared.tiers,
      runBy: req.user._id
    },
    { upsert: true, new: true, runValidators: true }
  );

  res.json({ success: true, draw, previewEntries: prepared.entries });
});

export const publishDraw = asyncHandler(async (req, res) => {
  const { month, year, logic } = req.validated.body;
  const existing = await Draw.findOne({ month, year, status: 'published' });
  if (existing) throw new ApiError(409, 'This month has already been published');

  const prepared = await prepareDraw({ month, year, logic });
  const draw = await Draw.findOneAndUpdate(
    { month, year },
    {
      month,
      year,
      logic,
      status: 'published',
      winningNumbers: prepared.winningNumbers,
      activeSubscriberCount: prepared.activeSubscriberCount,
      totalPrizePool: prepared.totalPrizePool,
      jackpotRolloverIn: prepared.jackpotRolloverIn,
      jackpotRolloverOut: prepared.jackpotRolloverOut,
      tiers: prepared.tiers,
      publishedAt: new Date(),
      runBy: req.user._id
    },
    { upsert: true, new: true, runValidators: true }
  );

  await Winner.deleteMany({ draw: draw._id });
  const winners = await createWinnersForDraw(draw, prepared.entries);
  const users = await User.find({ _id: { $in: winners.map((winner) => winner.user) } });
  await Promise.all(users.map((user) => sendEmail({
    to: user.email,
    subject: 'You have a Digital Heroes prize to verify',
    text: 'Upload your score proof from your dashboard so the admin team can verify your prize.'
  })));

  res.status(201).json({ success: true, draw, winners });
});
