import { Router } from 'express';
import { myDashboard } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

export const dashboardRouter = Router();

dashboardRouter.get('/me', requireAuth, myDashboard);
