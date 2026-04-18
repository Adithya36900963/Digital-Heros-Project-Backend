import { Router } from 'express';
import { createScore, deleteScore, getScores, updateScore } from '../controllers/scoreController.js';
import { requireActiveSubscription, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { scoreSchemas } from '../validators/schemas.js';

export const scoreRouter = Router();

scoreRouter.use(requireAuth, requireActiveSubscription);
scoreRouter.get('/', getScores);
scoreRouter.post('/', validate(scoreSchemas.create), createScore);
scoreRouter.patch('/:id', validate(scoreSchemas.update), updateScore);
scoreRouter.delete('/:id', validate(scoreSchemas.id), deleteScore);
