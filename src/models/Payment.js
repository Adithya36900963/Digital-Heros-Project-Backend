import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    provider: { type: String, enum: ['razorpay', 'stripe', 'manual', 'mock'], required: true, index: true },
    plan: { type: String, enum: ['monthly', 'yearly'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'verified'],
      default: 'created',
      index: true
    },
    providerOrderId: { type: String, index: true },
    providerPaymentId: { type: String, index: true },
    providerSignature: String,
    failureReason: String,
    verifiedAt: Date,
    rawProviderResponse: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

paymentSchema.index({ provider: 1, providerOrderId: 1 }, { unique: true, sparse: true });

export const Payment = mongoose.model('Payment', paymentSchema);
