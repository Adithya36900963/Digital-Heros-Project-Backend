import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    ipAddress: { type: String, trim: true },
    forwardedFor: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    browser: { type: String, trim: true },
    browserVersion: { type: String, trim: true },
    operatingSystem: { type: String, trim: true },
    deviceType: { type: String, trim: true },
    deviceName: { type: String, trim: true },
    source: { type: String, trim: true, default: 'password' },
    loginAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

loginHistorySchema.index({ user: 1, loginAt: -1 });

export const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
