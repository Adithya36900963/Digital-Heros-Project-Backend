import { Router } from 'express';
import { login, me, myLoginHistory, register, resendVerification, verifyEmail } from '../controllers/authController.js';
import { updateMyProfile } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authSchemas } from '../validators/schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate(authSchemas.register), register);
authRouter.post('/login', validate(authSchemas.login), login);
authRouter.post('/verify-email', validate(authSchemas.verifyEmail), verifyEmail);
authRouter.post('/resend-verification', validate(authSchemas.resendVerification), resendVerification);
authRouter.get('/me', requireAuth, me);
authRouter.get('/login-history', requireAuth, myLoginHistory);
authRouter.patch('/me', requireAuth, updateMyProfile);
