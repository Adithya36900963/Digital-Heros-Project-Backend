import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    charity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'gbp' },
    source: { type: String, enum: ['subscription', 'independent'], default: 'independent' },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    providerPaymentId: String
  },
  { timestamps: true }
);

export const Donation = mongoose.model('Donation', donationSchema);
