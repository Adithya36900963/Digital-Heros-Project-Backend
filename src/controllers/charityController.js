import { Charity } from '../models/Charity.js';
import { Donation } from '../models/Donation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const objectIdPattern = /^[a-f\d]{24}$/i;

export const listCharities = asyncHandler(async (req, res) => {
  const { search, category, country, featured } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (country) filter.country = country;
  if (featured !== undefined) filter.isFeatured = featured === 'true';
  if (search) filter.$text = { $search: search };

  const charities = await Charity.find(filter).sort({ isFeatured: -1, name: 1 });
  res.json({ success: true, charities });
});

export const getCharity = asyncHandler(async (req, res) => {
  const key = req.params.idOrSlug;
  const charity = objectIdPattern.test(key)
    ? await Charity.findById(key)
    : await Charity.findOne({ slug: key });
  if (!charity) throw new ApiError(404, 'Charity not found');
  res.json({ success: true, charity });
});

export const createCharity = asyncHandler(async (req, res) => {
  const charity = await Charity.create(req.validated.body);
  res.status(201).json({ success: true, charity });
});

export const updateCharity = asyncHandler(async (req, res) => {
  const charity = await Charity.findByIdAndUpdate(req.validated.params.id, req.validated.body, {
    new: true,
    runValidators: true
  });
  if (!charity) throw new ApiError(404, 'Charity not found');
  res.json({ success: true, charity });
});

export const deleteCharity = asyncHandler(async (req, res) => {
  const charity = await Charity.findByIdAndUpdate(req.validated.params.id, { isActive: false }, { new: true });
  if (!charity) throw new ApiError(404, 'Charity not found');
  res.json({ success: true, charity });
});

export const createIndependentDonation = asyncHandler(async (req, res) => {
  const { charityId, amount, currency = 'gbp' } = req.body;
  const charity = await Charity.findById(charityId);
  if (!charity) throw new ApiError(404, 'Charity not found');
  const donation = await Donation.create({
    user: req.user?._id,
    charity: charity._id,
    amount,
    currency,
    source: 'independent',
    status: 'pending'
  });
  res.status(201).json({ success: true, donation });
});
