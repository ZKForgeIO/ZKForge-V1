import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../lib/auth.js';

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${req.userId}-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5*1024*1024 },
  fileFilter: (_, file, cb) => {
    const ok = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('invalid file type'), ok);
  }
});

router.post('/profile-picture', authMiddleware, upload.single('file'), (req, res) => {
  const url = `${process.env.PUBLIC_BASE_URL}/uploads/${req.file.filename}`;
  res.json({ ok:true, url });
});
export default router;
