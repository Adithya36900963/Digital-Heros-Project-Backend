import { env } from '../config/env.js';
import { Subscription } from '../models/Subscription.js';
import { Draw } from '../models/Draw.js';

export const TIER_CONFIG = [
  { matchType: '5-match', poolSharePercentage: 40, rollover: true },
  { matchType: '4-match', poolSharePercentage: 35, rollover: false },
  { matchType: '3-match', poolSharePercentage: 25, rollover: false }
];

export function planAmount(plan) {
  return plan === 'yearly' ? env.yearlyPlanAmount : env.monthlyPlanAmount;
}

export function calculateSubscriptionContributions(amount, charityPercentage) {
  const charityContribution = Math.round(amount * (charityPercentage / 100));
  const prizePoolContribution = Math.round(amount * (env.prizePoolPercentage / 100));
  return { charityContribution, prizePoolContribution };
}

export async function calculateMonthlyPrizePool(month, year) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const activeSubscriptions = await Subscription.find({
    status: 'active',
    currentPeriodStart: { $lt: end },
    currentPeriodEnd: { $gte: start }
  });

  const totalPrizePool = activeSubscriptions.reduce((sum, subscription) => {
    return sum + subscription.prizePoolContribution;
  }, 0);

  const previousDraw = await Draw.findOne({ status: 'published' }).sort({ year: -1, month: -1 });
  const jackpotRolloverIn = previousDraw?.jackpotRolloverOut || 0;

  return {
    activeSubscriberCount: activeSubscriptions.length,
    totalPrizePool,
    jackpotRolloverIn
  };
}
