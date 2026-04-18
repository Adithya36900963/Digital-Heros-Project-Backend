import { Router } from 'express';
import {
  listWinners,
  markWinnerPaid,
  myWinners,
  reviewWinner,
  uploadWinnerProof
} from '../controllers/winnerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadProof } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { winnerSchemas } from '../validators/schemas.js';

export const winnerRouter = Router();

winnerRouter.use(requireAuth);
winnerRouter.get('/me', myWinners);
winnerRouter.get('/', requireRole('admin'), listWinners);
winnerRouter.post('/:id/proof', validate(winnerSchemas.id), uploadProof.single('proof'), uploadWinnerProof);
winnerRouter.patch('/:id/review', requireRole('admin'), validate(winnerSchemas.review), reviewWinner);
winnerRouter.patch('/:id/paid', requireRole('admin'), validate(winnerSchemas.id), markWinnerPaid);
