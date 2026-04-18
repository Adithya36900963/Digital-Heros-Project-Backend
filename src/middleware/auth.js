import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { ApiError } from '../utils/ApiError.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication token required');

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select('+passwordHash');
    if (!user || user.status !== 'active') throw new ApiError(401, 'Invalid user session');

    req.user = user;
    next();
  } catch (err) {
    next(err.statusCode ? err : new ApiError(401, 'Invalid or expired token'));
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Insufficient permissions'));
  next();
};

export async function requireActiveSubscription(req, res, next) {
  if (req.user.role === 'admin') return next();

  const subscription = await Subscription.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  const now = new Date();
  const isActive = subscription?.status === 'active' && (!subscription.currentPeriodEnd || subscription.currentPeriodEnd >= now);

  if (!isActive) {
    return next(new ApiError(402, 'Active subscription required'));
  }

  req.subscription = subscription;
  next();
}
