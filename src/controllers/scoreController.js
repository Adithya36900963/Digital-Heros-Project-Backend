import { Score } from '../models/Score.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function listUserScores(userId) {
  return Score.find({ user: userId }).sort({ playedAt: -1 });
}

async function enforceLatestFive(userId) {
  const scores = await Score.find({ user: userId }).sort({ playedAt: -1 });
  const extra = scores.slice(5);
  if (extra.length) await Score.deleteMany({ _id: { $in: extra.map((score) => score._id) } });
}

export const getScores = asyncHandler(async (req, res) => {
  res.json({ success: true, scores: await listUserScores(req.user._id) });
});

export const createScore = asyncHandler(async (req, res) => {
  const { value, playedAt, notes } = req.validated.body;
  const normalizedDate = startOfUtcDay(playedAt);
  const duplicate = await Score.findOne({ user: req.user._id, playedAt: normalizedDate });
  if (duplicate) throw new ApiError(409, 'Only one score entry is permitted per date');

  await Score.create({ user: req.user._id, value, playedAt: normalizedDate, notes });
  await enforceLatestFive(req.user._id);

  res.status(201).json({ success: true, scores: await listUserScores(req.user._id) });
});

export const updateScore = asyncHandler(async (req, res) => {
  const score = await Score.findOne({ _id: req.validated.params.id, user: req.user._id });
  if (!score) throw new ApiError(404, 'Score not found');

  if (req.validated.body.playedAt) {
    const normalizedDate = startOfUtcDay(req.validated.body.playedAt);
    const duplicate = await Score.findOne({ user: req.user._id, playedAt: normalizedDate, _id: { $ne: score._id } });
    if (duplicate) throw new ApiError(409, 'Only one score entry is permitted per date');
    score.playedAt = normalizedDate;
  }

  if (req.validated.body.value !== undefined) score.value = req.validated.body.value;
  if (req.validated.body.notes !== undefined) score.notes = req.validated.body.notes;
  await score.save();
  await enforceLatestFive(req.user._id);

  res.json({ success: true, scores: await listUserScores(req.user._id) });
});

export const deleteScore = asyncHandler(async (req, res) => {
  const score = await Score.findOneAndDelete({ _id: req.validated.params.id, user: req.user._id });
  if (!score) throw new ApiError(404, 'Score not found');
  res.json({ success: true, scores: await listUserScores(req.user._id) });
});
