import { Charity } from '../models/Charity.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const updateMyProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'country', 'selectedCharity', 'charityContributionPercentage'];
  const patch = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  }

  if (patch.selectedCharity) {
    const charity = await Charity.findOne({ _id: patch.selectedCharity, isActive: true });
    if (!charity) throw new ApiError(404, 'Selected charity was not found');
  }

  const user = await User.findByIdAndUpdate(req.user._id, patch, {
    new: true,
    runValidators: true
  }).populate('selectedCharity');

  res.json({ success: true, user });
});
