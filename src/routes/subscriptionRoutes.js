import { Router } from 'express';
import {
  cancelSubscription,
  createCheckoutSession,
  createRazorpayOrder,
  manualActivateSubscription,
  mySubscription,
  verifyRazorpayPayment
} from '../controllers/subscriptionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { subscriptionSchemas } from '../validators/schemas.js';

export const subscriptionRouter = Router();

subscriptionRouter.use(requireAuth);
subscriptionRouter.get('/me', mySubscription);
subscriptionRouter.post('/checkout-session', validate(subscriptionSchemas.checkout), createCheckoutSession);
subscriptionRouter.post('/razorpay/order', validate(subscriptionSchemas.razorpayOrder), createRazorpayOrder);
subscriptionRouter.post('/razorpay/verify', validate(subscriptionSchemas.razorpayVerify), verifyRazorpayPayment);
subscriptionRouter.post('/cancel', cancelSubscription);
subscriptionRouter.post('/manual-activate', requireRole('admin'), validate(subscriptionSchemas.manualActivate), manualActivateSubscription);
