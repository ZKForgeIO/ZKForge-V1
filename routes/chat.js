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

// --- Per-conversation symmetric key storage (32 bytes) ---
const ConvKeySchema = new mongoose.Schema({
  conversation_id: { type: String, unique: true, index: true },
  key:             { type: Buffer, required: true } // 32B symmetric key
}, { versionKey:false });

const ConversationKey = mongoose.models.ConversationKey
  || mongoose.model('ConversationKey', ConvKeySchema);

// helpers
async function ensureConvKey(conversation_id) {
  let rec = await ConversationKey.findOne({ conversation_id }).lean();
  if (rec) return rec;
  const key = Buffer.from(nacl.randomBytes(32));
  await ConversationKey.create({ conversation_id, key });
  return { conversation_id, key };
}

async function userInConversation(userId, conversationId) {
  const p = await ConversationParticipant.findOne({ conversation_id: conversationId, user_id: userId }).lean();
  return !!p;
}

function concatUint8(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0); out.set(b, a.length);
  return out;
}

// Normalize any Buffer/BSON Binary to a plain Uint8Array
function toU8(b) {
  try {
    if (b instanceof Uint8Array) return new Uint8Array(b);
    if (Buffer.isBuffer(b)) return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
    if (b && b.buffer) return new Uint8Array(b.buffer, b.byteOffset || 0, b.length || b.byteLength);
  } catch (_) {}
  throw new Error('invalid key buffer');
}

export default function chatRouter(io) {
  const router = express.Router();

  // ---------------------------
  // GET /chat/conv-key?conversationId=...
  // Returns a sealed copy of the 32B room key for this user:
  // { ok, version:1, ephPub, nonce, sealed } (all base58)
  // ---------------------------
  router.get('/conv-key', authMiddleware, async (req, res) => {
    const t0 = Date.now();
    try {
      const userId = req.userId;
      const conversationId = String(req.query.conversationId || '');
      if (!conversationId) return res.status(400).json({ ok:false, error:'conversationId required' });

      // must be participant
      if (!await userInConversation(userId, conversationId)) {
        console.warn('[conv-key] forbidden', { userId, conversationId });
        return res.status(403).json({ ok:false, error:'forbidden' });
      }

      // fetch/create room key
      const rec = await ensureConvKey(conversationId);
      const roomKeyU8 = toU8(rec.key);
      if (roomKeyU8.length !== 32) {
        console.error('[conv-key] bad conv key size', { conversationId, len: roomKeyU8.length });
        return res.status(500).json({ ok:false, error:'bad conv key size' });
      }

      // get user's Ed25519 public key from profile and convert to Curve25519
      const me = await Profile.findById(userId, { zk_public_key:1 }).lean();
      if (!me?.zk_public_key) return res.status(400).json({ ok:false, error:'missing user zk_public_key' });

      const edPub = bs58.decode(me.zk_public_key);           // 32 bytes Ed25519
      const curvePub = ed2curve.convertPublicKey(edPub);     // X25519 (Curve25519)
      if (!curvePub) return res.status(400).json({ ok:false, error:'ed2curve conversion failed' });

      // seal room key to user (nacl.box)
      const eph = nacl.box.keyPair();
      const nonce = nacl.randomBytes(nacl.box.nonceLength);
      const sealed = nacl.box(roomKeyU8, nonce, curvePub, eph.secretKey);

      console.log('[conv-key] seal', {
        userId, conversationId,
        keyLen: roomKeyU8.length,
        ephPubLen: eph.publicKey.length,
        nonceLen: nonce.length,
        sealedLen: sealed.length,
        ms: Date.now() - t0
      });

      return res.json({
        ok: true, version: 1,
        ephPub: bs58.encode(eph.publicKey),
        nonce:  bs58.encode(nonce),
        sealed: bs58.encode(sealed)
      });
    } catch (e) {
      console.error('[conv-key] error', e);
      return res.status(500).json({ ok:false, error:'failed to provide conversation key' });
    }
  });

  // ---------------------------
  // GET /chat/conversations
  // returns latest encrypted last_message for previews
  // ---------------------------
  router.get('/conversations', authMiddleware, async (req, res) => {
    const userId = req.userId;

    const participation = await ConversationParticipant.find({ user_id: userId }).lean();
    const convIds = participation.map(p => p.conversation_id);
    const conversations = await Conversation.find({ _id: { $in: convIds } }).lean();

    const result = await Promise.all(conversations.map(async (c) => {
      const last = await Message.find({ conversation_id: c._id, is_deleted:false })
        .sort({ created_at:-1 }).limit(1).lean();

      const others = await ConversationParticipant.find({ conversation_id:c._id, user_id: { $ne: userId } }).lean();
      let other_user = null;
      if (others?.[0]) {
        const p = await Profile.findById(others[0].user_id, { username:1, is_online:1, profile_picture_url:1 }).lean();
        if (p) other_user = { username: p.username, is_online: !!p.is_online, profile_picture_url: p.profile_picture_url || undefined };
      }

      return {
        id: c._id, name: c.name || null, is_group: !!c.is_group, updated_at: c.updated_at,
        last_message: last[0] ? {
          id: last[0]._id,
          conversation_id: last[0].conversation_id,
          sender_id: last[0].sender_id,
          created_at: last[0].created_at,
          // encrypted fields
          ciphertext_b58: last[0].ciphertext_b58,
          nonce_b58:      last[0].nonce_b58,
          sig_b58:        last[0].sig_b58
        } : undefined,
        other_user
      };
    }));

    result.sort((a,b) =>
      new Date(b.last_message?.created_at || b.updated_at) - new Date(a.last_message?.created_at || a.updated_at)
    );

    res.json({ ok:true, conversations: result });
  });

  // ---------------------------
  // POST /chat/conversations { otherUserId }
  // creates DM if not exists; ensures per-conv key exists
  // ---------------------------
  router.post('/conversations', authMiddleware, async (req, res) => {
    const me = req.userId;
    const { otherUserId } = req.body || {};
    if (!otherUserId) return res.status(400).json({ ok:false, error:'otherUserId required' });

    // reuse existing 1:1
    const myConvs = await ConversationParticipant.find({ user_id: me }).lean();
    for (const cp of myConvs) {
      const participants = await ConversationParticipant.find({ conversation_id: cp.conversation_id }).lean();
      if (participants.length === 2 && participants.some(p => p.user_id === otherUserId)) {
        const conv = await Conversation.findById(cp.conversation_id).lean();
        await ensureConvKey(conv._id);
        return res.json({ ok:true, conversation: conv });
      }
    }

    // create new
    const convId = newId();
    await Conversation.create({ _id: convId, is_group:false, updated_at:new Date() });
    await ConversationParticipant.insertMany([
      { conversation_id: convId, user_id: me },
      { conversation_id: convId, user_id: otherUserId }
    ]);
    await ensureConvKey(convId);

    const conv = await Conversation.findById(convId).lean();
    io.to(otherUserId).emit('conversation:new', { conversation: conv });
    res.json({ ok:true, conversation: conv });
  });

  // ---------------------------
  // GET /chat/messages?conversationId=...
  // returns encrypted messages + lightweight sender info
  // ---------------------------
  router.get('/messages', authMiddleware, async (req, res) => {
    const { conversationId } = req.query;
    if (!conversationId) return res.status(400).json({ ok:false, error:'conversationId required' });

    // must be participant
    if (!await userInConversation(req.userId, conversationId)) {
      return res.status(403).json({ ok:false, error:'forbidden' });
    }

    const rows = await Message.find({ conversation_id: conversationId, is_deleted:false }).sort({ created_at:1 }).lean();
    const ids = [...new Set(rows.map(r => r.sender_id))];
    const profs = await Profile.find({ _id: { $in: ids } }, { username:1, profile_picture_url:1 }).lean();
    const map = Object.fromEntries(profs.map(p => [String(p._id), p]));

    const messages = rows.map(r => ({
      id: r._id,
      conversation_id: r.conversation_id,
      sender_id: r.sender_id,
      created_at: r.created_at,
      ciphertext_b58: r.ciphertext_b58,
      nonce_b58: r.nonce_b58,
      sig_b58: r.sig_b58 || undefined,
      sender: map[r.sender_id]
        ? { username: map[r.sender_id].username, profile_picture_url: map[r.sender_id].profile_picture_url || undefined }
        : undefined
    }));

    res.json({ ok:true, messages });
  });

  // ---------------------------
  // POST /chat/messages
  // body: { conversationId, ciphertext_b58, nonce_b58, sig_b58? }
  // stores encrypted payload; broadcasts same to participants
  // ---------------------------
  router.post('/messages', authMiddleware, async (req, res) => {
    const t0 = Date.now();
    try {
      const meId = req.userId;
      const { conversationId, ciphertext_b58, nonce_b58, sig_b58 } = req.body || {};
      if (!conversationId || !ciphertext_b58 || !nonce_b58) {
        return res.status(400).json({ ok:false, error:'conversationId, ciphertext_b58 and nonce_b58 required' });
      }

      // must be participant
      if (!await userInConversation(meId, conversationId)) {
        return res.status(403).json({ ok:false, error:'forbidden' });
      }

      // (optional but recommended) verify Ed25519 signature over (nonce||ciphertext)
      if (sig_b58) {
        const me = await Profile.findById(meId, { zk_public_key:1 }).lean();
        const edPub = me?.zk_public_key ? bs58.decode(me.zk_public_key) : null;
        if (!edPub || edPub.length !== 32) return res.status(400).json({ ok:false, error:'invalid sender public key' });

        const nonce = bs58.decode(nonce_b58);
        const ct = bs58.decode(ciphertext_b58);
        const sig = bs58.decode(sig_b58);

        const ok = nacl.sign.detached.verify(concatUint8(nonce, ct), sig, edPub);
        if (!ok) return res.status(400).json({ ok:false, error:'invalid signature' });
      }

      // persist encrypted message
      const id = newId();
      const msg = await Message.create({
        _id: id,
        conversation_id: conversationId,
        sender_id: meId,
        ciphertext_b58,
        nonce_b58,
        sig_b58: sig_b58 || null
      });

      await Conversation.findByIdAndUpdate(conversationId, { updated_at: new Date() });

      const me = await Profile.findById(meId, { username:1, profile_picture_url:1 }).lean();
      const payload = {
        id: msg._id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        ciphertext_b58: msg.ciphertext_b58,
        nonce_b58: msg.nonce_b58,
        sig_b58: msg.sig_b58 || undefined,
        sender: me ? { username: me.username, profile_picture_url: me.profile_picture_url || undefined } : undefined
      };

      // broadcast to all participants
      const parts = await ConversationParticipant.find({ conversation_id: conversationId }).lean();
      for (const p of parts) io.to(p.user_id).emit('message:new', payload);

      console.log('[chat:post message] ok', {
        conversationId, sender: meId, ms: Date.now() - t0
      });

      return res.json({ ok:true, message: payload });
    } catch (e) {
      console.error('[chat:post message] error', e);
      return res.status(500).json({ ok:false, error:'failed to send message' });
    }
  });

  return router;
}
