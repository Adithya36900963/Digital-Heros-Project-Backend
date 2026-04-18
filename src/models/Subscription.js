import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: String, enum: ['monthly', 'yearly'], required: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'cancelled', 'lapsed'],
      default: 'pending',
      index: true
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'gbp' },
    provider: { type: String, enum: ['stripe', 'razorpay', 'manual', 'mock'], default: 'stripe' },
    providerCustomerId: String,
    providerSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelledAt: Date,
    prizePoolContribution: { type: Number, default: 0 },
    charityContribution: { type: Number, default: 0 },
    charity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity' }
  },
  { timestamps: true }
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
