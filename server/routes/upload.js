import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { requireAdmin } from '../utils/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.resolve(__dirname, '../uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME_EXT[file.mimetype] || '.jpg';
    cb(null, `cover-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_EXT[file.mimetype]) {
      cb(new Error('Only JPG, PNG, and WebP images are supported (max 5 MB).'));
      return;
    }
    cb(null, true);
  },
});

const router = express.Router();

router.post('/', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        message: err.message || 'Image upload failed.',
      });
    }
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: 'Please select an image file to upload.',
      });
    }
    return res.status(201).json({
      ok: true,
      url: `/uploads/${req.file.filename}`,
    });
  });
});

export default router;
