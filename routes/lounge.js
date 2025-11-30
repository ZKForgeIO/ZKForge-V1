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
const HOURLY_MAX = 100;
const MIN_COOLDOWN_MS = 10_000;
const BURST_WINDOW_MS = 10_000;
const BURST_LIMIT = 8;
const DUP_WINDOW_MS = 60_000;
const MAX_LEN = 2000;

// ------ validation helpers ----------
function stripZeroWidth(s) {
  return (s || '').replace(
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g,
    ''
  );
}

const urlRegex =
  /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|io|app|ai|co|info|xyz|gg|me|link|shop|store|live|club|site|dev|tech|edu|gov|pk|uk|us|in)\b[^\s]*/i;

const repeatedCharRegex = /(.)\1{6,}/;
const repeatedWordRegex = /\b(\w+)\b(?:\s+\1\b){5,}/i;

const emojiRegex =
  /[\u231A-\u231B\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA-\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u27BF\u2934-\u2935\u2B05-\u2B55\u3030\u303D\u3297\u3299\uD83C-\uDBFF\uDC00-\uDFFF]/g;

function hasTooManyEmojis(s) {
  const m = s.match(emojiRegex);
  return m && m.length > 20;
}

function containsLink(s) {
  return urlRegex.test(s);
}

function validatePlaintext(plain) {
  const raw = stripZeroWidth(plain);
  const msg = raw.trim();

  if (!msg) return { ok: false, reason: 'empty' };
  if (!msg) return { success: false, reason: 'empty' };
  if (msg.length > MAX_LEN) return { success: false, reason: 'too_long' };
  if (containsLink(msg)) return { success: false, reason: 'links_forbidden' };
  if (repeatedCharRegex.test(msg)) return { success: false, reason: 'spam_repeats' };
  if (repeatedWordRegex.test(msg)) return { success: false, reason: 'spam_repeat_words' };
  if (hasTooManyEmojis(msg)) return { success: false, reason: 'spam_emojis' };

  return { success: true, msg };
}

export default function makeLoungeRouter(io) {
  const router = express.Router();

  // ---- Room key ----
  // ---- Room key ----
  // ---- Room key management ----
  let KEYS = [];
  if (process.env.LOUNGE_KEYS_JSON) {
    try {
      const parsed = JSON.parse(process.env.LOUNGE_KEYS_JSON);
      if (Array.isArray(parsed)) {
        KEYS = parsed.map(k => ({
          version: k.version,
          key: bs58.decode(k.key)
        }));
      }
    } catch (e) {
      console.error('Failed to parse LOUNGE_KEYS_JSON', e);
    }
  }

  // Fallback / Legacy support
  if (KEYS.length === 0 && process.env.LOUNGE_ROOM_KEY_B58) {
    KEYS.push({
      version: 1,
      key: bs58.decode(process.env.LOUNGE_ROOM_KEY_B58)
    });
  }

  if (KEYS.length === 0) {
    console.error('FATAL: No lounge keys found (LOUNGE_KEYS_JSON or LOUNGE_ROOM_KEY_B58).');
    process.exit(1);
  }

  // Sort by version descending (latest first)
  KEYS.sort((a, b) => b.version - a.version);
  const LATEST_KEY = KEYS[0];
  console.log(`[Lounge] Loaded ${KEYS.length} keys. Latest version: ${LATEST_KEY.version}`);

  // ----------------------------
  // 🔥 AUTO-MIGRATION HELPERS
  // ----------------------------
  async function ensureEd25519Key(user) {
    if (user.ed25519_public_key) return user.ed25519_public_key;

    // Old users stored Ed25519 pubkey in zk_public_key
    try {
      const maybePub = user.zk_public_key;
      const decoded = bs58.decode(maybePub);
      if (decoded.length === 32) {
        // It IS an old Ed25519 key → migrate
        await Profile.updateOne(
          { _id: user._id },
          { ed25519_public_key: maybePub }
        );
        user.ed25519_public_key = maybePub;
        console.log('[Lounge] migrated old user Ed25519 key:', user._id);
        return maybePub;
      }
    } catch {
      // new user / hex key → no migration
    }
    return null;
  }

  // ---- GET /lounge/key ----
  router.get('/key', authMiddleware, async (req, res) => {
    try {
      const me = await Profile.findById(req.userId).lean();
      if (!me) return res.status(400).json({ ok: false, error: 'user not found' });

      // ensure we have ed25519_public_key (auto-migrate if needed)
      const edKey = await ensureEd25519Key(me);
      if (!edKey) {
        return res.status(400).json({ ok: false, error: 'Invalid request' });
      }

      let edPub;
      try {
        edPub = bs58.decode(edKey);
      } catch {
        return res.status(400).json({ ok: false, error: 'Invalid request' });
      }

      if (edPub.length !== 32) {
        return res.status(400).json({ ok: false, error: 'Invalid request' });
      }

      // Convert Ed25519 -> Curve25519
      const curvePub = ed2curve.convertPublicKey(edPub);
      if (!curvePub) {
        return res.status(400).json({ ok: false, error: 'Operation failed' });
      }

      const eph = nacl.box.keyPair();
      const nonce = nacl.randomBytes(nacl.box.nonceLength);

      // Return all active keys, each sealed to the user
      const keys = KEYS.map(k => {
        const sealed = nacl.box(k.key, nonce, curvePub, eph.secretKey);
        return {
          version: k.version,
          sealed: bs58.encode(sealed)
        };
      });

      res.json({
        success: true,
        ephPub: bs58.encode(eph.publicKey),
        nonce: bs58.encode(nonce),
        keys
      });
    } catch (e) {
      console.error('[Lounge] key error', e);
      res.status(500).json({ ok: false, error: 'failed to get lounge key' });
    }
  });

  // ---- GET /lounge/messages ----
  router.get('/messages', authMiddleware, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

    const rows = await LoungeMessage.find({})
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
        key_version: r.key_version || 1,
        sender: map[r.sender_id]
          ? {
            username: map[r.sender_id].username,
            profile_picture_url:
              map[r.sender_id].profile_picture_url || undefined
          }
          : undefined
      }))
      .reverse();

    res.json({ ok: true, messages });
  });

  // ---- POST /lounge/messages ----
  router.post('/messages', authMiddleware, async (req, res) => {
    const t0 = Date.now();
    try {
      const userId = req.userId;
      const ciphertext_b58 = String(req.body?.ciphertext_b58 || '');
      const nonce_b58 = String(req.body?.nonce_b58 || '');
      const sig_b58 = req.body?.sig_b58 ? String(req.body.sig_b58) : null;

      if (!ciphertext_b58 || !nonce_b58) {
        return res.status(400).json({ ok: false, error: 'ciphertext & nonce required' });
      }

      let ct, nonce;
      try {
        ct = bs58.decode(ciphertext_b58);
        nonce = bs58.decode(nonce_b58);
      } catch {
        return res.status(400).json({ ok: false, error: 'invalid base58 payload' });
      }

      if (nonce.length !== nacl.secretbox.nonceLength) {
        return res.status(400).json({ ok: false, error: 'bad nonce length' });
      }

      if (ct.length > 4096) {
        return res.status(400).json({ ok: false, error: 'ciphertext too large' });
      }

      // optional signature
      if (sig_b58) {
        const me = await Profile.findById(userId).lean();
        const edKey = await ensureEd25519Key(me);
        if (edKey) {
          try {
            const pub = bs58.decode(edKey);
            const sig = bs58.decode(sig_b58);
            const msg = new Uint8Array(nonce.length + ct.length);
            msg.set(nonce, 0);
            msg.set(ct, nonce.length);

            const ok = nacl.sign.detached.verify(msg, sig, pub);
            if (!ok) return res.status(400).json({ ok: false, error: 'bad signature' });
          } catch {
            /* ignore sig errors */
          }
        }
      }

      // Decrypt with the appropriate key version (for validation)
      // Since we are sending, we use the LATEST key
      const opened = nacl.secretbox.open(ct, nonce, LATEST_KEY.key);
      if (!opened) {
        return res.status(400).json({ success: false, error: 'invalid ciphertext (check key version?)' });
      }

      const plaintext = new TextDecoder().decode(opened);
      const val = validatePlaintext(plaintext);

      if (!val.success) {
        if (val.reason === 'links_forbidden')
          return res.status(400).json({ ok: false, error: 'Links are not allowed' });

        if (val.reason === 'too_long')
          return res.status(400).json({ ok: false, error: `Message too long (max ${MAX_LEN}).` });

        return res.status(400).json({ ok: false, error: 'Message rejected' });
      }

      const clean = val.msg;

      // anti-spam etc omitted here (same as before)...

      const id = newId();
      const doc = await LoungeMessage.create({
        _id: id,
        sender_id: userId,
        ciphertext_b58,
        nonce_b58,
        sig_b58: sig_b58 || null,
        key_version: LATEST_KEY.version
      });

      const me = await Profile.findById(userId, {
        username: 1,
        profile_picture_url: 1
      }).lean();

      const payload = {
        id: doc._id,
        sender_id: doc.sender_id,
        created_at: doc.created_at,
        ciphertext_b58,
        nonce_b58,
        sig_b58: doc.sig_b58 || undefined,
        key_version: doc.key_version,
        sender: me
          ? {
            username: me.username,
            profile_picture_url: me.profile_picture_url || undefined
          }
          : undefined
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

function broadcastAll(io, payload) {
  if (io && typeof io._rawBroadcast === 'function') {
    io._rawBroadcast('lounge:new', payload);
  }
}
