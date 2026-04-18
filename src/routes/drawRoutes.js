import { Router } from 'express';
import { getDraw, listDraws, publishDraw, simulateDraw } from '../controllers/drawController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { drawSchemas } from '../validators/schemas.js';

export const drawRouter = Router();

drawRouter.get('/', listDraws);
drawRouter.get('/:id', validate(drawSchemas.id), getDraw);
drawRouter.post('/simulate', requireAuth, requireRole('admin'), validate(drawSchemas.run), simulateDraw);
drawRouter.post('/publish', requireAuth, requireRole('admin'), validate(drawSchemas.run), publishDraw);
