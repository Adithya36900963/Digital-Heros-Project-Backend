import { Score } from '../models/Score.js';
import { Subscription } from '../models/Subscription.js';
import { Winner } from '../models/Winner.js';
import { User } from '../models/User.js';
import { TIER_CONFIG } from './prizePoolService.js';

function uniqueRandomNumbers(count = 5, max = 45) {
  const numbers = new Set();
  while (numbers.size < count) numbers.add(Math.floor(Math.random() * max) + 1);
  return [...numbers].sort((a, b) => a - b);
}

function weightedPick(weightedNumbers, used) {
  const available = weightedNumbers.filter((item) => !used.has(item.value));
  const total = available.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of available) {
    cursor -= item.weight;
    if (cursor <= 0) return item.value;
  }
  return available[available.length - 1].value;
}

export async function generateWinningNumbers(logic) {
  if (logic === 'random') return uniqueRandomNumbers();

  const frequencies = await Score.aggregate([
    { $group: { _id: '$value', count: { $sum: 1 } } }
  ]);

  const byScore = new Map(frequencies.map((item) => [item._id, item.count]));
  const weightedNumbers = Array.from({ length: 45 }, (_, index) => {
    const value = index + 1;
    return { value, weight: Math.max(1, byScore.get(value) || 0) };
  });

  const picked = new Set();
  while (picked.size < 5) picked.add(weightedPick(weightedNumbers, picked));
  return [...picked].sort((a, b) => a - b);
}

export async function findEligibleEntries({ winningNumbers, month, year }) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const activeSubscriptions = await Subscription.find({
    status: 'active',
    currentPeriodStart: { $lt: end },
    currentPeriodEnd: { $gte: start }
  }).select('user');
  const activeUserIds = activeSubscriptions.map((subscription) => subscription.user);

  const scores = await Score.find({ user: { $in: activeUserIds } })
    .sort({ playedAt: -1 })
    .lean();

  const grouped = new Map();
  for (const score of scores) {
    const key = score.user.toString();
    if (!grouped.has(key)) grouped.set(key, []);
    if (grouped.get(key).length < 5) grouped.get(key).push(score.value);
  }

  return [...grouped.entries()]
    .filter(([, values]) => values.length === 5)
    .map(([userId, values]) => {
      const matchedNumbers = [...new Set(values.filter((value) => winningNumbers.includes(value)))];
      return { userId, values, matchedNumbers, matchCount: matchedNumbers.length };
    });
}

export function buildPrizeTiers({ totalPrizePool, jackpotRolloverIn, matchBuckets }) {
  return TIER_CONFIG.map((tier) => {
    const winners = matchBuckets[tier.matchType] || [];
    const baseAmount = Math.round(totalPrizePool * (tier.poolSharePercentage / 100));
    const poolAmount = tier.rollover ? baseAmount + jackpotRolloverIn : baseAmount;
    const prizePerWinner = winners.length ? Math.floor(poolAmount / winners.length) : 0;
    const rolloverAmount = tier.rollover && winners.length === 0 ? poolAmount : 0;

    return {
      matchType: tier.matchType,
      poolSharePercentage: tier.poolSharePercentage,
      poolAmount,
      winnerCount: winners.length,
      prizePerWinner,
      rolloverAmount
    };
  });
}

export async function createWinnersForDraw(draw, entries) {
  const matchBuckets = {
    '5-match': entries.filter((entry) => entry.matchCount >= 5),
    '4-match': entries.filter((entry) => entry.matchCount === 4),
    '3-match': entries.filter((entry) => entry.matchCount === 3)
  };

  const winners = [];
  for (const tier of draw.tiers) {
    const bucket = matchBuckets[tier.matchType] || [];
    for (const entry of bucket) {
      winners.push({
        user: entry.userId,
        draw: draw._id,
        matchType: tier.matchType,
        matchedNumbers: entry.matchedNumbers,
        prizeAmount: tier.prizePerWinner
      });
    }
  }

  if (!winners.length) return [];
  const created = await Winner.insertMany(winners, { ordered: false });

  for (const winner of created) {
    await User.findByIdAndUpdate(winner.user, { $inc: { totalWon: winner.prizeAmount } });
  }

  return created;
}
