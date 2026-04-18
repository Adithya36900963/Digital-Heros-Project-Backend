import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/tokens.js';
import {
  createEmailVerificationToken,
  hashEmailVerificationToken,
  sendVerificationEmail
} from '../services/verificationService.js';

function userResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    selectedCharity: user.selectedCharity,
    charityContributionPercentage: user.charityContributionPercentage
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, selectedCharity, charityContributionPercentage, country } = req.validated.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email is already registered');

  const passwordHash = await User.hashPassword(password);
  const verification = createEmailVerificationToken();
  const user = await User.create({
    name,
    email,
    passwordHash,
    selectedCharity,
    charityContributionPercentage,
    country,
    emailVerificationTokenHash: verification.tokenHash,
    emailVerificationExpiresAt: verification.expiresAt
  });

  const emailResult = await sendVerificationEmail(user, verification.token);

  res.status(201).json({
    success: true,
    message: emailResult.skipped
      ? 'Account created. SMTP is not configured, so use the dev verification token to verify this email.'
      : 'Account created. Check your email to verify your account.',
    user: userResponse(user),
    verificationEmailSkipped: Boolean(emailResult.skipped),
    devVerificationToken: emailResult.skipped ? verification.token : undefined
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isEmailVerified) throw new ApiError(403, 'Please verify your email before logging in');

  user.lastLoginAt = new Date();
  await user.save();

  res.json({ success: true, token: signToken(user), user: userResponse(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('selectedCharity');
  res.json({ success: true, user });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.validated.body;
  const tokenHash = hashEmailVerificationToken(token);
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() }
  }).select('+emailVerificationTokenHash');

  if (!user) throw new ApiError(400, 'Verification link is invalid or expired');

  user.isEmailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();

  res.json({ success: true, token: signToken(user), user: userResponse(user) });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.validated.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'Account not found');
  if (user.isEmailVerified) return res.json({ success: true, message: 'Email is already verified' });

  const verification = createEmailVerificationToken();
  user.emailVerificationTokenHash = verification.tokenHash;
  user.emailVerificationExpiresAt = verification.expiresAt;
  await user.save();

  const emailResult = await sendVerificationEmail(user, verification.token);

  res.json({
    success: true,
    message: emailResult.skipped
      ? 'SMTP is not configured, so use the dev verification token to verify this email.'
      : 'Verification email sent.',
    verificationEmailSkipped: Boolean(emailResult.skipped),
    devVerificationToken: emailResult.skipped ? verification.token : undefined
  });
});
