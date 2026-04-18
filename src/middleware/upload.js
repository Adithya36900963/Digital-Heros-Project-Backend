import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const proofDir = path.resolve('uploads', 'proofs');
fs.mkdirSync(proofDir, { recursive: true });

const storage = multer.diskStorage({
  destination: proofDir,
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

export const uploadProof = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.mimetype)) {
      return cb(new ApiError(400, 'Proof must be a JPG, PNG, WEBP, or PDF file'));
    }
    cb(null, true);
  }
});
