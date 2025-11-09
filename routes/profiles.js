import express from 'express';
import Profile from '../models/Profile.js';
import { authMiddleware } from '../lib/auth.js';

const router = express.Router();

router.get('/search', authMiddleware, async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ ok:true, results: [] });
  const me = req.userId;
  const results = await Profile.find(
    { _id: { $ne: me }, username: { $regex: q, $options: 'i' } },
    { _id:1, username:1, is_online:1, profile_picture_url:1 }
  ).limit(10).lean();
  res.json({ ok:true, results: results.map(r => ({ id: r._id, username: r.username, is_online: !!r.is_online, profile_picture_url: r.profile_picture_url || undefined })) });
});

router.patch('/', authMiddleware, async (req, res) => {
  const { username, profile_picture_url } = req.body || {};
  if (username) {
    if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username))
      return res.status(400).json({ ok:false, error:'Invalid username' });
    const taken = await Profile.findOne({ username, _id: { $ne: req.userId }});
    if (taken) return res.status(409).json({ ok:false, error:'Username already taken' });
  }
  const updated = await Profile.findByIdAndUpdate(
    req.userId,
    { ...(username && { username }), profile_picture_url: profile_picture_url ?? null },
    { new:true }
  ).lean();
  res.json({ ok:true, profile: updated });
});

export default router;
