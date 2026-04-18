import { Router } from 'express';
import {
  createCharity,
  createIndependentDonation,
  deleteCharity,
  getCharity,
  listCharities,
  updateCharity
} from '../controllers/charityController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { charitySchemas } from '../validators/schemas.js';

export const charityRouter = Router();

charityRouter.get('/', listCharities);
charityRouter.get('/:idOrSlug', getCharity);
charityRouter.post('/donations', requireAuth, createIndependentDonation);
charityRouter.post('/', requireAuth, requireRole('admin'), validate(charitySchemas.create), createCharity);
charityRouter.patch('/:id', requireAuth, requireRole('admin'), validate(charitySchemas.update), updateCharity);
charityRouter.delete('/:id', requireAuth, requireRole('admin'), validate(charitySchemas.id), deleteCharity);
