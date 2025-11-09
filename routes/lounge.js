// routes/lounge.js
import express from 'express';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import ed2curve from 'ed2curve';

import { authMiddleware } from '../lib/auth.js';
import { newId } from '../lib/ids.js';
import Profile from '../models/Profile.js';
import LoungeMessage from '../models/LoungeMessage.js';

// --- Limits / knobs ---
const HOURLY_MAX = 100;                 // 100 msgs per hour per user
const MIN_COOLDOWN_MS = 10_000;         // cooldown between sends

export default function makeLoungeRouter(io) {
  const router = express.Router();

  // ---- Room key (KEPT SERVER-SIDE) ----
  // Persist in ENV to avoid breaking decryption after restart
  // Set: LOUNGE_ROOM_KEY_B58 = base58(32 random bytes)
  const ROOM_KEY_B58 = process.env.LOUNGE_ROOM_KEY_B58 || bs58.encode(nacl.randomBytes(32));
  console.log("ROOM_KEY_B58 :", ROOM_KEY_B58)
  const ROOM_KEY = bs58.decode(ROOM_KEY_B58); // Uint8Array(32)

  // ---- GET /lounge/key  -> sealed room key for this user ----
  router.get('/key', authMiddleware, async (req, res) => {
    try {
      const me = await Profile.findById(req.userId, { zk_public_key: 1 }).lean();
      if (!me?.zk_public_key) return res.status(400).json({ ok: false, error: 'no pubkey' });

      // User’s Ed25519 public key (base58 -> 32B)
      const edPub = bs58.decode(me.zk_public_key);
      if (edPub.length !== 32) return res.status(400).json({ ok: false, error: 'bad ed25519 pub' });

      // Convert to Curve25519 for nacl.box
      const curvePub = ed2curve.convertPublicKey(edPub);
      if (!curvePub) return res.status(400).json({ ok: false, error: 'curve conversion failed' });

      // Ephemeral sender
      const eph = nacl.box.keyPair();
      const nonce = nacl.randomBytes(nacl.box.nonceLength);

      // Seal ROOM_KEY for the user
      const sealed = nacl.box(ROOM_KEY, nonce, curvePub, eph.secretKey);

      res.json({
        ok: true,
        ephPub: bs58.encode(eph.publicKey),
        nonce: bs58.encode(nonce),
        sealed: bs58.encode(sealed),
        version: 1
      });
    } catch (e) {
      console.error('[Lounge] key', e);
      res.status(500).json({ ok: false, error: 'failed to get lounge key' });
    }
  });

  // ---- GET /lounge/messages?limit=50  (encrypted payloads) ----
  router.get('/messages', authMiddleware, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

    const rows = await LoungeMessage
      .find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    const senderIds = [...new Set(rows.map(r => r.sender_id))];
    const profs = await Profile.find(
      { _id: { $in: senderIds } },
      { username: 1, profile_picture_url: 1 }
    ).lean();
    const map = Object.fromEntries(profs.map(p => [String(p._id), p]));

    const messages = rows
      .map(r => ({
        id: r._id,
        sender_id: r.sender_id,
        created_at: r.created_at,
        ciphertext_b58: r.ciphertext_b58,
        nonce_b58: r.nonce_b58,
        sig_b58: r.sig_b58 || undefined,
        sender: map[r.sender_id]
          ? {
              username: map[r.sender_id].username,
              profile_picture_url: map[r.sender_id].profile_picture_url || undefined
            }
          : undefined
      }))
      .reverse(); // newest last for UI

    res.json({ ok: true, messages });
  });

  // ---- POST /lounge/messages { ciphertext_b58, nonce_b58, sig_b58? } ----
  router.post('/messages', authMiddleware, async (req, res) => {
    try {
      const userId = req.userId;
      const ciphertext_b58 = String(req.body?.ciphertext_b58 || '');
      const nonce_b58 = String(req.body?.nonce_b58 || '');
      const sig_b58 = req.body?.sig_b58 ? String(req.body.sig_b58) : null;

      if (!ciphertext_b58 || !nonce_b58) {
        return res.status(400).json({ ok: false, error: 'ciphertext & nonce required' });
      }

      // basic shape checks
      const ct = bs58.decode(ciphertext_b58);
      const nonce = bs58.decode(nonce_b58);
      if (nonce.length !== nacl.secretbox.nonceLength) {
        return res.status(400).json({ ok: false, error: 'bad nonce length' });
      }
      // sanity cap ciphertext size (prevents abuse)
      if (ct.length > 4096) {
        return res.status(400).json({ ok: false, error: 'ciphertext too large' });
      }

      // cooldown: check most recent message by this user
      const latest = await LoungeMessage.findOne({ sender_id: userId }).sort({ created_at: -1 }).lean();
      if (latest && Date.now() - new Date(latest.created_at).getTime() < MIN_COOLDOWN_MS) {
        const remainingMs = MIN_COOLDOWN_MS - (Date.now() - new Date(latest.created_at).getTime());
        const secs = Math.ceil(remainingMs / 1000);
        return res.status(429).json({ ok: false, error: `Please wait ${Math.max(1, Math.floor(secs/60))} minute(s) before sending another message.` });
      }

      // hourly cap
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const hourCount = await LoungeMessage.countDocuments({ sender_id: userId, created_at: { $gte: since } });
      if (hourCount >= HOURLY_MAX) {
        return res.status(429).json({ ok: false, error: 'Message limit reached. You can send up to 100 messages per hour.' });
      }

      // (optional) verify signature over (nonce || ciphertext)
      if (sig_b58) {
        const me = await Profile.findById(userId, { zk_public_key: 1 }).lean();
        if (me?.zk_public_key) {
          const pub = bs58.decode(me.zk_public_key); // Ed25519
          if (pub.length === 32) {
            const sig = bs58.decode(sig_b58);
            const msg = new Uint8Array(nonce.length + ct.length);
            msg.set(nonce, 0); msg.set(ct, nonce.length);
            const ok = nacl.sign.detached.verify(msg, sig, pub);
            if (!ok) return res.status(400).json({ ok: false, error: 'bad signature' });
          }
        }
      }

      const id = newId();
      const doc = await LoungeMessage.create({
        _id: id,
        sender_id: userId,
        ciphertext_b58,
        nonce_b58,
        sig_b58: sig_b58 || null
      });

      const me = await Profile.findById(userId, { username: 1, profile_picture_url: 1 }).lean();
      const payload = {
        id: doc._id,
        sender_id: doc.sender_id,
        created_at: doc.created_at,
        ciphertext_b58,
        nonce_b58,
        sig_b58: doc.sig_b58 || undefined,
        sender: me ? {
          username: me.username,
          profile_picture_url: me.profile_picture_url || undefined
        } : undefined
      };

      io.broadcast?.('lounge:new', payload) || broadcastAll(io, payload);
      return res.json({ ok: true, message: payload });
    } catch (e) {
      console.error('[Lounge] send failed', e);
      return res.status(500).json({ ok: false, error: 'Failed to send message.' });
    }
  });

  return router;
}

// Fallback broadcast if io.broadcast is not defined
function broadcastAll(io, payload) {
  if (io && typeof io._rawBroadcast === 'function') {
    io._rawBroadcast('lounge:new', payload);
  }
}
