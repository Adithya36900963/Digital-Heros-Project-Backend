import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/tokens.js';

function userResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    selectedCharity: user.selectedCharity,
    charityContributionPercentage: user.charityContributionPercentage
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, selectedCharity, charityContributionPercentage, country } = req.validated.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email is already registered');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    selectedCharity,
    charityContributionPercentage,
    country
  });

  res.status(201).json({ success: true, token: signToken(user), user: userResponse(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');

  user.lastLoginAt = new Date();
  await user.save();

  res.json({ success: true, token: signToken(user), user: userResponse(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('selectedCharity');
  res.json({ success: true, user });
});
