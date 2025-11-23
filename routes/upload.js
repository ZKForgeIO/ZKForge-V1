// This will include all necessary security audit fixes as per your description
// For simplicity, we will break each file down below with secure patches
// Fixes included:
// - Path traversal protection
// - Secure hashing
// - Session binding
// - Expired session cleanup
// - Session revocation
// - Refresh tokens
// - Rate limiting (per-endpoint & global)
// - Required signature verification
// - CORS hardening

// Due to size limits and clarity, I will update each affected file separately
// Beginning with: routes/upload.js

// 1. routes/upload.js (Path traversal mitigation)
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../lib/auth.js';

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const sanitizeExt = (ext) => ext.toLowerCase().replace(/[^a-z0-9.]/g, '');

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    let ext = sanitizeExt(path.extname(file.originalname || ''));
    if (!ALLOWED_EXT.includes(ext)) ext = '.png'; // fallback or reject
    cb(null, `${req.userId}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('invalid file type'), ok);
  }
});

router.post('/profile-picture', authMiddleware, upload.single('file'), (req, res) => {
  const url = `${process.env.PUBLIC_BASE_URL}/uploads/${req.file.filename}`;
  res.json({ ok: true, url });
});

export default router;

// 
// Next file to be fixed: routes/transactions.js for secure hash
//
