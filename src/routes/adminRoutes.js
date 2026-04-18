import { Router } from 'express';
import { analytics, listUsers, updateUser } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));
adminRouter.get('/users', listUsers);
adminRouter.patch('/users/:id', updateUser);
adminRouter.get('/analytics', analytics);
