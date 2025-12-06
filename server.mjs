// 5. server.mjs (CORS hardening + global rate limiting)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import path from 'path';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import uploadRoutes from './routes/upload.js';
import makeChatRouter from './routes/chat.js';
import txRoutes from './routes/transactions.js';
import loungeRoutes from './routes/lounge.js';
import api404Routes from './routes/404API.js';

const app = express();
app.set('trust proxy', 1); // ✅ safer than true

// Request logging middleware (security/debug visibility)
app.use(morgan('combined'));

/**
 * CORS configuration
 *
 * - Uses ALLOWED_ORIGINS env variable (comma-separated) when provided.
 *   Example:
 *   ALLOWED_ORIGINS=https://app.zkforge.io,https://another.trusted.app
 *
 * - If ALLOWED_ORIGINS is not set:
 *   - In production: defaults to ['https://app.zkforge.io']
 *   - In non-production: also allows localhost Vite dev:
 *       http://localhost:5173
 *       http://127.0.0.1:5173
 */

// Build default origins
const defaultAllowedOrigins = ['https://app.zkforge.io'];

// Allow React Vite localhost only in non-production
if (process.env.NODE_ENV !== 'production') {
  defaultAllowedOrigins.push(
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  );
}

// Parse ALLOWED_ORIGINS env, if provided
const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Final list
const allowedOrigins = envAllowedOrigins.length > 0
  ? envAllowedOrigins
  : defaultAllowedOrigins;

// Helper to check origin
function isOriginAllowed(origin) {
  // Non-browser / same-origin requests may not send Origin header
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

console.log('CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    // Block disallowed origins
    return callback(new Error('CORS origin denied'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // If you ever need cookies, you can enable this.
  // For pure Bearer tokens in headers, it's not required:
  credentials: false
}));

// Global rate limit
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

app.use(express.json({ limit: '2mb' }));

// Content-Type validation
app.use((req, res, next) => {
  if (req.method !== 'GET' && !req.is('application/json')) {
    return res.status(415).json({ error: 'Unsupported Media Type' });
  }
  next();
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// CORS error handler (must come after cors() middleware)
app.use((err, req, res, next) => {
  if (err && err.message === 'CORS origin denied') {
    return res.status(403).json({ error: 'CORS origin denied' });
  }
  next(err);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const io = {
  to(userId) {
    return {
      emit: (type, payload) => {
        wss.clients.forEach((c) => {
          if (c.userId === userId && c.readyState === c.OPEN) {
            c.send(JSON.stringify({ type, payload }));
          }
        });
      }
    };
  },
  broadcast(type, payload) {
    wss.clients.forEach((c) => {
      if (c.readyState === c.OPEN) {
        try {
          c.send(JSON.stringify({ type, payload }));
        } catch { }
      }
    });
  },
  _rawBroadcast(type, payload) {
    this.broadcast(type, payload);
  }
};

// WebSocket authentication + origin check
wss.on('connection', (ws, req) => {
  // ✅ CORS-like origin restriction for WebSocket
  const origin = req.headers.origin;
  if (!isOriginAllowed(origin)) {
    ws.close(1008, 'origin not allowed');
    return;
  }

  try {
    // Client should connect with: new WebSocket('ws://host/ws', token)
    const protocolHeader = req.headers['sec-websocket-protocol'];
    const token = Array.isArray(protocolHeader) ? protocolHeader[0] : protocolHeader;

    if (!token) {
      ws.close(1008, 'unauthorized');
      return;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });

    ws.userId = payload.uid;
  } catch {
    ws.close(1008, 'unauthorized');
    return;
  }

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    try { ws.ping(); } catch { }
  });
}, 30000);

app.use('/transactions', txRoutes);
app.use('/auth', authRoutes);
app.use('/profiles', profileRoutes);
app.use('/upload', uploadRoutes);
app.use('/chat', makeChatRouter(io));
app.use('/lounge', loungeRoutes(io));
app.use('/404', api404Routes);

app.get('/health', (_, res) => res.json({ ok: true }));

async function start() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'zkchat' });
  server.listen(process.env.PORT, () => {
    console.log(`HTTP http://localhost:${process.env.PORT}`);
    console.log(`WS   ws://localhost:${process.env.PORT}/ws (token via subprotocol)`);
    console.log('CORS allowed origins:', allowedOrigins);
    console.log('NODE_ENV:', process.env.NODE_ENV);
  });
}
start();
