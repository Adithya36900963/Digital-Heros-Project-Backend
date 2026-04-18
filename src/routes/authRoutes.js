import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authSchemas } from '../validators/schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate(authSchemas.register), register);
authRouter.post('/login', validate(authSchemas.login), login);
authRouter.get('/me', requireAuth, me);
