import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import path from 'path';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import uploadRoutes from './routes/upload.js';
import starkRoutes from './routes/stark.js';
import makeChatRouter from './routes/chat.js';
import txRoutes from './routes/transactions.js';
import loungeRoutes from './routes/lounge.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// tiny “io”-like wrapper on top of ws
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
  // broadcast to all authenticated clients
  broadcast(type, payload) {
    wss.clients.forEach((c) => {
      if (c.readyState === c.OPEN) {
        try { c.send(JSON.stringify({ type, payload })); } catch {}
      }
    });
  },
  // expose raw for routes that may call it (optional)
  _rawBroadcast(type, payload) {
    this.broadcast(type, payload);
  }
};

// auth the ws with ?token=
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

  // optional: basic heartbeat
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});

// optional: heartbeat to cleanup dead sockets
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
app.use('/stark', starkRoutes);        // /stark/next-proof
app.use('/chat', makeChatRouter(io));  // conversations + messages
app.use('/lounge', loungeRoutes(io)); // <<— add this

app.get('/health', (_, res) => res.json({ ok: true }));

async function start() {
  
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'zkchat' });
  server.listen(process.env.PORT, () => {
    console.log(`HTTP http://localhost:${process.env.PORT}`);
    console.log(`WS   ws://localhost:${process.env.PORT}/ws?token=<JWT>`);
  });
}
start();
