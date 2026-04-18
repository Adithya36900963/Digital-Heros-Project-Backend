import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { Charity } from '../models/Charity.js';
import { Donation } from '../models/Donation.js';
import { Payment } from '../models/Payment.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calculateSubscriptionContributions, planAmount } from '../services/prizePoolService.js';

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;
const razorpay = env.razorpayKeyId && env.razorpayKeySecret
  ? new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret })
  : null;

function periodEnd(plan, start = new Date(), monthsOverride) {
  const date = new Date(start);
  date.setMonth(date.getMonth() + (monthsOverride || (plan === 'yearly' ? 12 : 1)));
  return date;
}

async function createActiveSubscription({ user, plan, provider = 'manual', months }) {
  const amount = planAmount(plan);
  const { charityContribution, prizePoolContribution } = calculateSubscriptionContributions(
    amount,
    user.charityContributionPercentage
  );

  const subscription = await Subscription.create({
    user: user._id,
    plan,
    status: 'active',
    amount,
    currency: env.currency,
    provider,
    currentPeriodStart: new Date(),
    currentPeriodEnd: periodEnd(plan, new Date(), months),
    prizePoolContribution,
    charityContribution,
    charity: user.selectedCharity
  });

  if (user.selectedCharity) {
    await Donation.create({
      user: user._id,
      charity: user.selectedCharity,
      amount: charityContribution,
      currency: env.currency,
      source: 'subscription',
      status: 'paid'
    });
    await Charity.findByIdAndUpdate(user.selectedCharity, { $inc: { totalContributed: charityContribution } });
  }

  return subscription;
}

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const { plan } = req.validated.body;
  const amount = planAmount(plan);

  if (!stripe) {
    return res.json({
      success: true,
      checkout: {
        mode: 'mock',
        message: 'Set STRIPE_SECRET_KEY to create a real Stripe Checkout session',
        plan,
        amount,
        currency: env.currency
      }
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: env.currency,
          unit_amount: amount,
          recurring: { interval: plan === 'yearly' ? 'year' : 'month' },
          product_data: { name: `Digital Heroes ${plan} subscription` }
        },
        quantity: 1
      }
    ],
    success_url: `${env.clientUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.clientUrl}/subscription/cancelled`,
    metadata: { userId: req.user._id.toString(), plan }
  });

  res.json({ success: true, checkoutUrl: session.url, sessionId: session.id });
});

export const mySubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id }).sort({ createdAt: -1 }).populate('charity');
  res.json({ success: true, subscription });
});

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { plan } = req.validated.body;
  const amount = planAmount(plan);
  const currency = env.currency.toUpperCase();

  if (!razorpay) {
    const payment = await Payment.create({
      user: req.user._id,
      provider: 'mock',
      plan,
      amount,
      currency,
      status: 'created',
      providerOrderId: `order_mock_${Date.now()}`
    });

    return res.json({
      success: true,
      order: {
        mode: 'mock',
        id: payment.providerOrderId,
        amount,
        currency,
        plan,
        paymentId: payment._id,
        keyId: env.razorpayKeyId,
        message: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to create a real Razorpay order'
      }
    });
  }

  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt: `dh_${req.user._id.toString().slice(-8)}_${Date.now()}`,
    notes: {
      userId: req.user._id.toString(),
      plan,
      email: req.user.email
    }
  });

  const payment = await Payment.create({
    user: req.user._id,
    provider: 'razorpay',
    plan,
    amount: order.amount,
    currency: order.currency,
    status: 'created',
    providerOrderId: order.id,
    rawProviderResponse: order
  });

  res.status(201).json({
    success: true,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      paymentId: payment._id,
      keyId: env.razorpayKeyId,
      name: 'Digital Heroes',
      description: `Digital Heroes ${plan} subscription`
    }
  });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  if (!razorpay || !env.razorpayKeySecret) throw new ApiError(503, 'Razorpay is not configured');

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.validated.body;
  const payment = await Payment.findOne({
    user: req.user._id,
    provider: 'razorpay',
    providerOrderId: razorpay_order_id
  });

  if (!payment) throw new ApiError(404, 'Payment order not found for this user');
  if (payment.status === 'verified' && payment.subscription) {
    const existingSubscription = await Subscription.findById(payment.subscription).populate('charity');
    return res.json({ success: true, subscription: existingSubscription, payment });
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    payment.status = 'failed';
    payment.failureReason = 'Invalid Razorpay signature';
    payment.providerPaymentId = razorpay_payment_id;
    payment.providerSignature = razorpay_signature;
    await payment.save();
    throw new ApiError(400, 'Razorpay payment verification failed');
  }

  const order = await razorpay.orders.fetch(razorpay_order_id);
  const plan = order.notes?.plan;
  const userId = order.notes?.userId;

  if (!['monthly', 'yearly'].includes(plan)) throw new ApiError(400, 'Razorpay order is missing a valid plan');
  if (userId !== req.user._id.toString()) throw new ApiError(403, 'Razorpay order does not belong to this user');
  if (Number(order.amount) !== Number(payment.amount)) throw new ApiError(400, 'Razorpay order amount does not match payment record');
  if (String(order.currency).toUpperCase() !== String(payment.currency).toUpperCase()) throw new ApiError(400, 'Razorpay order currency does not match payment record');

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  const subscription = await createActiveSubscription({ user, plan, provider: 'razorpay' });
  subscription.providerSubscriptionId = razorpay_order_id;
  subscription.providerCustomerId = razorpay_payment_id;
  await subscription.save();

  payment.status = 'verified';
  payment.subscription = subscription._id;
  payment.providerPaymentId = razorpay_payment_id;
  payment.providerSignature = razorpay_signature;
  payment.verifiedAt = new Date();
  payment.rawProviderResponse = order;
  await payment.save();

  res.json({ success: true, subscription, payment });
});

export const myPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('subscription');
  res.json({ success: true, payments });
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id, status: 'active' }).sort({ createdAt: -1 });
  if (!subscription) throw new ApiError(404, 'Active subscription not found');
  subscription.status = 'cancelled';
  subscription.cancelledAt = new Date();
  await subscription.save();
  res.json({ success: true, subscription });
});

export const manualActivateSubscription = asyncHandler(async (req, res) => {
  const { userId, plan, months } = req.validated.body;
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  const subscription = await createActiveSubscription({ user, plan, provider: 'manual', months });
  res.status(201).json({ success: true, subscription });
});

export { createActiveSubscription };
