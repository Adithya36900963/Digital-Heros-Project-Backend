import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5001),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/digital_heroes',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  currency: process.env.CURRENCY || 'inr',
  monthlyPlanAmount: Number(process.env.MONTHLY_PLAN_AMOUNT || 1000),
  yearlyPlanAmount: Number(process.env.YEARLY_PLAN_AMOUNT || 10000),
  prizePoolPercentage: Number(process.env.PRIZE_POOL_PERCENTAGE || 50),
  minCharityPercentage: Number(process.env.MIN_CHARITY_PERCENTAGE || 10),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'Digital Heroes <noreply@digitalheroes.local>'
};
