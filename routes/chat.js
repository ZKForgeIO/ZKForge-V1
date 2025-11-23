// routes/chat.js
import express from 'express';
import mongoose from 'mongoose';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import ed2curve from 'ed2curve';

import { authMiddleware } from '../lib/auth.js';
import Conversation from '../models/Conversation.js';
import ConversationParticipant from '../models/ConversationParticipant.js';
import Message from '../models/Message.js';
import Profile from '../models/Profile.js';
import { newId } from '../lib/ids.js';

/* -------------------------------------------------------
   Conversation Key Storage (unchanged)
------------------------------------------------------- */
const ConvKeySchema = new mongoose.Schema(
  {
    conversation_id: { type: String, unique: true, index: true },
    key: { type: Buffer, required: true }
  },
  { versionKey: false }
);

const ConversationKey =
  mongoose.models.ConversationKey ||
  mongoose.model('ConversationKey', ConvKeySchema);

async function ensureConvKey(conversation_id) {
  let rec = await ConversationKey.findOne({ conversation_id }).lean();
  if (rec) return rec;

  const key = Buffer.from(nacl.randomBytes(32));
  await ConversationKey.create({ conversation_id, key });
  return { conversation_id, key };
}

async function userInConversation(userId, conversationId) {
  return !!(await ConversationParticipant.findOne({
    conversation_id: conversationId,
    user_id: userId
  }).lean());
}

function concatUint8(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function toU8(b) {
  if (b instanceof Uint8Array) return new Uint8Array(b);
  if (Buffer.isBuffer(b))
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  if (b && b.buffer)
    return new Uint8Array(b.buffer, b.byteOffset || 0, b.length || b.byteLength);
  throw new Error('invalid key buffer');
}

async function getConvKeyU8(conversation_id) {
  const rec = await ensureConvKey(conversation_id);
  const u8 = toU8(rec.key);
  if (u8.length !== 32) throw new Error('bad conv key size');
  return u8;
}

/* -------------------------------------------------------
   Old-User Auto-Migration (same as Lounge)
------------------------------------------------------- */
async function ensureEd25519(profile) {
  if (profile.ed25519_public_key) return profile.ed25519_public_key;

  // try auto-migrate old base58 zk_public_key
  try {
    const maybePub = profile.zk_public_key;
    const decoded = bs58.decode(maybePub);
    if (decoded.length === 32) {
      await Profile.updateOne(
        { _id: profile._id },
        { ed25519_public_key: maybePub }
      );
      profile.ed25519_public_key = maybePub;
      console.log('[chat] migrated Ed25519 key for user:', profile._id);
      return maybePub;
    }
  } catch {}

  return null;
}

/* -------------------------------------------------------
   Message Validation
------------------------------------------------------- */
const MAX_LEN = 2000;

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
  const raw = stripZeroWidth(plain || '');
  const msg = raw.trim();

  if (!msg) return { ok: false, reason: 'empty' };
  if (msg.length > MAX_LEN) return { ok: false, reason: 'too_long' };
  if (containsLink(msg)) return { ok: false, reason: 'links_forbidden' };
  if (repeatedCharRegex.test(msg))
    return { ok: false, reason: 'spam_repeats' };
  if (repeatedWordRegex.test(msg))
    return { ok: false, reason: 'spam_repeat_words' };
  if (hasTooManyEmojis(msg)) return { ok: false, reason: 'spam_emojis' };

  return { ok: true, msg };
}

/* -------------------------------------------------------
   Router
------------------------------------------------------- */
export default function chatRouter(io) {
  const router = express.Router();

  /* ----------------------------------------------
     GET /chat/conv-key
     Seals conversation key to user's Ed25519 key
  ---------------------------------------------- */
  router.get('/conv-key', authMiddleware, async (req, res) => {
    try {
      const userId = req.userId;
      const conversationId = String(req.query.conversationId || '');

      if (!conversationId)
        return res.status(400).json({ ok: false, error: 'conversationId required' });

      if (!(await userInConversation(userId, conversationId)))
        return res.status(403).json({ ok: false, error: 'forbidden' });

      const roomKeyU8 = await getConvKeyU8(conversationId);

      const me = await Profile.findById(userId).lean();
      const edKey = await ensureEd25519(me);
      if (!edKey) return res.status(400).json({ ok: false, error: 'No Ed25519 key' });

      let edPub;
      try {
        edPub = bs58.decode(edKey);
      } catch {
        return res.status(400).json({ ok: false, error: 'Invalid Ed25519 key format' });
      }

      const curvePub = ed2curve.convertPublicKey(edPub);
      if (!curvePub)
        return res.status(400).json({ ok: false, error: 'Curve25519 conversion failed' });

      const eph = nacl.box.keyPair();
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const sealed = nacl.box(roomKeyU8, nonce, curvePub, eph.secretKey);

      return res.json({
        ok: true,
        version: 2,
        ephPub: bs58.encode(eph.publicKey),
        nonce: bs58.encode(nonce),
        sealed: bs58.encode(sealed)
      });
    } catch (e) {
      console.error('[chat] conv-key error', e);
      return res.status(500).json({ ok: false, error: 'failed' });
    }
  });

  /* ----------------------------------------------
     GET /chat/conversations
  ---------------------------------------------- */
  router.get('/conversations', authMiddleware, async (req, res) => {
    const userId = req.userId;

    const participation = await ConversationParticipant.find({
      user_id: userId
    }).lean();

    const convIds = participation.map(p => p.conversation_id);
    const conversations = await Conversation.find({
      _id: { $in: convIds }
    }).lean();

    const result = await Promise.all(
      conversations.map(async c => {
        const last = await Message.find({
          conversation_id: c._id,
          is_deleted: false
        })
          .sort({ created_at: -1 })
          .limit(1)
          .lean();

        const others = await ConversationParticipant.find({
          conversation_id: c._id,
          user_id: { $ne: userId }
        }).lean();

        let other_user = null;
        if (others?.[0]) {
          const p = await Profile.findById(others[0].user_id, {
            username: 1,
            is_online: 1,
            profile_picture_url: 1
          }).lean();
          if (p)
            other_user = {
              username: p.username,
              is_online: !!p.is_online,
              profile_picture_url: p.profile_picture_url || undefined
            };
        }

        return {
          id: c._id,
          name: c.name || null,
          is_group: !!c.is_group,
          updated_at: c.updated_at,
          last_message: last[0]
            ? {
                id: last[0]._id,
                sender_id: last[0].sender_id,
                created_at: last[0].created_at,
                ciphertext_b58: last[0].ciphertext_b58,
                nonce_b58: last[0].nonce_b58,
                sig_b58: last[0].sig_b58
              }
            : undefined,
          other_user
        };
      })
    );

    result.sort(
      (a, b) =>
        new Date(b.last_message?.created_at || b.updated_at) -
        new Date(a.last_message?.created_at || a.updated_at)
    );

    res.json({ ok: true, conversations: result });
  });

  /* ----------------------------------------------
     POST /chat/messages
     (All major fixes applied here)
  ---------------------------------------------- */
  router.post('/messages', authMiddleware, async (req, res) => {
    try {
      const meId = req.userId;
      const { conversationId, ciphertext_b58, nonce_b58, sig_b58 } = req.body;

      /* ---------------
         Required fields
      --------------- */
      if (!conversationId || !ciphertext_b58 || !nonce_b58)
        return res.status(400).json({
          ok: false,
          error: 'conversationId, ciphertext_b58, nonce_b58 required'
        });

      /* --------------------------------------
         Fix #13 — Signature now mandatory
      -------------------------------------- */
      if (!sig_b58) {
        return res.status(400).json({
          ok: false,
          error: 'Signature required'
        });
      }

      /* -------------------------
         Only conversation members
      ------------------------- */
      if (!(await userInConversation(meId, conversationId)))
        return res.status(403).json({ ok: false, error: 'forbidden' });

      /* -------------------------
         Decode crypto fields
      ------------------------- */
      let ct, nonce;
      try {
        ct = bs58.decode(ciphertext_b58);
        nonce = bs58.decode(nonce_b58);
      } catch {
        return res
          .status(400)
          .json({ ok: false, error: 'Invalid base58 ciphertext/nonce' });
      }

      if (nonce.length !== nacl.secretbox.nonceLength)
        return res.status(400).json({ ok: false, error: 'Bad nonce length' });

      if (ct.length > 8 * 1024)
        return res.status(400).json({ ok: false, error: 'Ciphertext too large' });

      /* ----------------------------------------------
         Verify signature with user's Ed25519 public key
      ---------------------------------------------- */
      const profile = await Profile.findById(meId).lean();
      const edKey = await ensureEd25519(profile);
      if (!edKey) {
        return res.status(400).json({
          ok: false,
          error: 'Missing Ed25519 public key'
        });
      }

      let edPub;
      try {
        edPub = bs58.decode(edKey);
        if (edPub.length !== 32) throw new Error();
      } catch {
        return res.status(400).json({
          ok: false,
          error: 'Invalid Ed25519 public key'
        });
      }

      const sig = bs58.decode(sig_b58);
      const msgToSign = concatUint8(nonce, ct);

      const ok = nacl.sign.detached.verify(msgToSign, sig, edPub);
      if (!ok) {
        return res
          .status(400)
          .json({ ok: false, error: 'Invalid signature' });
      }

      /* ----------------------------------------------
         Decrypt for policy validation only
      ---------------------------------------------- */
      const key = await getConvKeyU8(conversationId);
      const opened = nacl.secretbox.open(ct, nonce, key);
      if (!opened)
        return res.status(400).json({ ok: false, error: 'Invalid ciphertext' });

      const plaintext = new TextDecoder().decode(opened);
      const val = validatePlaintext(plaintext);

      if (!val.ok)
        return res
          .status(400)
          .json({ ok: false, error: 'Message rejected: ' + val.reason });

      const clean = val.msg;

      /* ----------------------------------------------
         Anti-spam: burst limit + duplicate protection
      ---------------------------------------------- */
      const burstSince = new Date(Date.now() - 10_000);
      const burstCount = await Message.countDocuments({
        conversation_id: conversationId,
        sender_id: meId,
        created_at: { $gte: burstSince }
      });

      if (burstCount >= 8)
        return res
          .status(429)
          .json({ ok: false, error: 'Too many messages, slow down.' });

      const dupSince = new Date(Date.now() - 60_000);
      const lastSame = await Message.findOne({
        conversation_id: conversationId,
        sender_id: meId,
        created_at: { $gte: dupSince }
      })
        .sort({ created_at: -1 })
        .lean();

      if (lastSame) {
        try {
          const lastCt = bs58.decode(lastSame.ciphertext_b58);
          const lastNonce = bs58.decode(lastSame.nonce_b58);
          const lastOpened = nacl.secretbox.open(lastCt, lastNonce, key);

          if (lastOpened) {
            const lastPlain = stripZeroWidth(
              new TextDecoder().decode(lastOpened)
            ).trim();
            if (lastPlain === clean) {
              return res
                .status(409)
                .json({ ok: false, error: 'Duplicate message' });
            }
          }
        } catch {}
      }

      /* ----------------------------------------------
         Save encrypted message (never plaintext)
      ---------------------------------------------- */
      const id = newId();
      const doc = await Message.create({
        _id: id,
        conversation_id: conversationId,
        sender_id: meId,
        ciphertext_b58,
        nonce_b58,
        sig_b58
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        updated_at: new Date()
      });

      const senderProfile = await Profile.findById(meId, {
        username: 1,
        profile_picture_url: 1
      }).lean();

      const payload = {
        id: doc._id,
        conversation_id: doc.conversation_id,
        sender_id: doc.sender_id,
        created_at: doc.created_at,
        ciphertext_b58,
        nonce_b58,
        sig_b58,
        sender: senderProfile
          ? {
              username: senderProfile.username,
              profile_picture_url:
                senderProfile.profile_picture_url || undefined
            }
          : undefined
      };

      /* ----------------------------------------------
         Broadcast to all participants
      ---------------------------------------------- */
      const parts = await ConversationParticipant.find({
        conversation_id: conversationId
      }).lean();

      for (const p of parts) {
        io.to(p.user_id).emit('message:new', payload);
      }

      return res.json({ ok: true, message: payload });
    } catch (e) {
      console.error('[chat] send error', e);
      return res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });

  return router;
}
