import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';

export function signSession(userId) {
  const token = jwt.sign({ uid: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const expires = new Date(Date.now() + 24*60*60*1000);
  return { token, expires };
}
export async function persistSession(token, userId, expiresAt) {
  await Session.create({ token, user_id: userId, expires_at: expiresAt });
}
export async function authMiddleware(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ ok:false, error:'unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const sess = await Session.findOne({ token, user_id: payload.uid, expires_at: { $gt: new Date() }});
    if (!sess) return res.status(401).json({ ok:false, error:'unauthorized' });
    req.userId = payload.uid;
    next();
  } catch {
    res.status(401).json({ ok:false, error:'unauthorized' });
  }
}
