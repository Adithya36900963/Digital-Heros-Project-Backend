import { Winner } from '../models/Winner.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const myWinners = asyncHandler(async (req, res) => {
  const winners = await Winner.find({ user: req.user._id }).populate('draw').sort({ createdAt: -1 });
  res.json({ success: true, winners });
});

export const listWinners = asyncHandler(async (req, res) => {
  const winners = await Winner.find()
    .populate('user', 'name email')
    .populate('draw')
    .sort({ createdAt: -1 });
  res.json({ success: true, winners });
});

export const uploadWinnerProof = asyncHandler(async (req, res) => {
  const winner = await Winner.findOne({ _id: req.validated.params.id, user: req.user._id });
  if (!winner) throw new ApiError(404, 'Winner record not found');
  if (!req.file) throw new ApiError(400, 'Proof file is required');

  winner.proof = { url: `/uploads/proofs/${req.file.filename}`, uploadedAt: new Date() };
  winner.verificationStatus = 'pending';
  winner.verificationNote = undefined;
  winner.reviewedBy = undefined;
  winner.reviewedAt = undefined;
  await winner.save();

  res.json({ success: true, winner });
});

export const reviewWinner = asyncHandler(async (req, res) => {
  const winner = await Winner.findById(req.validated.params.id);
  if (!winner) throw new ApiError(404, 'Winner record not found');
  if (!winner.proof?.url) throw new ApiError(409, 'Winner proof must be uploaded before review');

  winner.verificationStatus = req.validated.body.status;
  winner.verificationNote = req.validated.body.note;
  winner.reviewedBy = req.user._id;
  winner.reviewedAt = new Date();
  await winner.save();

  res.json({ success: true, winner });
});

export const markWinnerPaid = asyncHandler(async (req, res) => {
  const winner = await Winner.findById(req.validated.params.id);
  if (!winner) throw new ApiError(404, 'Winner record not found');
  if (winner.verificationStatus !== 'approved') throw new ApiError(409, 'Winner must be approved before payout');

  winner.paymentStatus = 'paid';
  winner.paidAt = new Date();
  await winner.save();

  res.json({ success: true, winner });
});
