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

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import uploadRoutes from './routes/upload.js';
import makeChatRouter from './routes/chat.js';
import txRoutes from './routes/transactions.js';
import loungeRoutes from './routes/lounge.js';
import api404Routes from './routes/404API.js';

const app = express();
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://zkforge.io'],
    credentials: true
  })
);
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
        } catch {}
      }
    });
  },
  _rawBroadcast(type, payload) {
    this.broadcast(type, payload);
  }
};

wss.on('connection', (ws, req) => {
  try {
    const qs = new URLSearchParams(req.url.split('?')[1] || '');
    const token = qs.get('token') || '';
    const payload = jwt.verify(token, process.env.JWT_SECRET);
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
    try { ws.ping(); } catch {}
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
    console.log(`WS   ws://localhost:${process.env.PORT}/ws?token=<JWT>`);
  });
}
start();
