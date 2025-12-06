import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
const ACCESS_TOKEN_LIFESPAN = 15 * 60;   // 15 minutes
const REFRESH_TOKEN_LIFESPAN = 7 * 24 * 60 * 60; // 7 days

// Hash function using SHA-256
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signSession(userId, roles = ['user']) {
  const nowSeconds = Math.floor(Date.now() / 1000);

  const accessPayload = {
    uid: userId,
    roles,
    jti: nanoid(),
    iat: nowSeconds
  };

  const refreshPayload = {
    uid: userId,
    roles,
    jti: nanoid(),
    iat: nowSeconds
  };

  const token = jwt.sign(accessPayload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: ACCESS_TOKEN_LIFESPAN
  });

  const refresh = jwt.sign(refreshPayload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: REFRESH_TOKEN_LIFESPAN
  });

  const decodedRefresh = jwt.decode(refresh);
  let expires;

  if (decodedRefresh && typeof decodedRefresh === 'object' && 'exp' in decodedRefresh) {
    expires = new Date(decodedRefresh.exp * 1000);
  } else {
    expires = new Date(Date.now() + REFRESH_TOKEN_LIFESPAN * 1000);
  }

  return { token, refresh, expires };
}

export async function persistSession(token, userId, expires, req = null) {
  if (!token || typeof token !== 'string') {
    console.error('persistSession: missing or invalid token');
    return;
  }

  const hashedToken = hashToken(token);

  const sessionData = {
    _id: hashedToken,
    user_id: userId,
    expires_at: expires
  };

  // Optionally store request metadata
  if (req) {
    sessionData.ip_address = req.ip;
    sessionData.user_agent = req.headers['user-agent'];
  }

  await Session.create(sessionData);
}

export async function verifySession(token) {
  const payload = jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256']
  });

  const hashedToken = hashToken(token);
  const session = await Session.findById(hashedToken);

  if (!session || session.revoked) throw new Error('Session invalid');

  return payload;
}

export async function revokeSession(token) {
  const hashedToken = hashToken(token);
  await Session.findByIdAndUpdate(hashedToken, { revoked: true });
}

export async function cleanupSessions() {
  await Session.deleteMany({ expires_at: { $lt: new Date() } });
}

export const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.split(' ')[1] ||
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'no token' });
    }

    const payload = await verifySession(token);
    req.userId = payload.uid;
    req.userRoles = payload.roles;
    next();
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' });
  }
};
