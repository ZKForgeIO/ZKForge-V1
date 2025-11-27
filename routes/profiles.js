import express from 'express';
import Profile from '../models/Profile.js';
import { authMiddleware } from '../lib/auth.js';

const router = express.Router();

// Escape regex special characters to prevent NoSQL injection
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ ok: true, results: [] });
    }

    // Use escaped regex and anchor to start to prevent ReDoS and injection
    const regex = new RegExp(`^${escapeRegex(q)}`, 'i');

    // Assuming 'User' model is intended here based on the instruction's snippet
    // If 'Profile' model should be used, replace 'User' with 'Profile'
    const users = await Profile.find({
      username: regex
    })
      .select('username profile_picture_url is_online') // Adjusted select fields to match original output structure
      .limit(10)
      .lean();

    res.json({ ok: true, results: users.map(r => ({ id: r._id, username: r.username, is_online: !!r.is_online, profile_picture_url: r.profile_picture_url || undefined })) });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

router.patch('/', authMiddleware, async (req, res) => {
  const { username, profile_picture_url } = req.body || {};
  if (username) {
    if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username))
      return res.status(400).json({ ok: false, error: 'Invalid username' });
    const taken = await Profile.findOne({ username, _id: { $ne: req.userId } });
    if (taken) return res.status(409).json({ ok: false, error: 'Username already taken' });
  }
  const updated = await Profile.findByIdAndUpdate(
    req.userId,
    { ...(username && { username }), profile_picture_url: profile_picture_url ?? null },
    { new: true }
  ).lean();
  res.json({ ok: true, profile: updated });
});

export default router;
