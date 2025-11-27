// 3. lib/auth.js (session revocation + refresh token pattern)
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import { nanoid } from 'nanoid';

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
const ACCESS_TOKEN_LIFESPAN = 15 * 60;   // 15 min
const REFRESH_TOKEN_LIFESPAN = 7 * 24 * 60 * 60; // 7 days

export function signSession(userId) {
  const token = jwt.sign({ uid: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_LIFESPAN });
  const refresh = jwt.sign({ uid: userId }, process.env.JWT_SECRET, { expiresIn: REFRESH_TOKEN_LIFESPAN });
  const expires = new Date(Date.now() + REFRESH_TOKEN_LIFESPAN * 1000);
  return { token, refresh, expires };
}

export async function persistSession(token, userId, expires) {
  if (!token || typeof token !== 'string') {
    console.error('persistSession: missing or invalid token');
    return;
  }
  await Session.create({ _id : token, user_id: userId, expires_at: expires });
}


export async function verifySession(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const session = await Session.findById(token);
  if (!session || session.revoked) throw new Error('Session invalid');
  return payload;
}

export async function revokeSession(token) {
  await Session.findByIdAndUpdate(token, { revoked: true });
}

export async function cleanupSessions() {
  await Session.deleteMany({ expires_at: { $lt: new Date() } });
}

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    if (!token) return res.status(401).json({ error: 'no token' });
    const payload = await verifySession(token);
    req.userId = payload.uid;
    next();
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' });
  }
};
