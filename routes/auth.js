// routes/auth.js
import express from 'express';
import Profile from '../models/Profile.js';
import Transaction from '../models/Transaction.js';
import { newId } from '../lib/ids.js';
import { deriveWalletFromZKSecret } from '../lib/solana.js';
import { signSession, persistSession, authMiddleware } from '../lib/auth.js';
import {
  normalizeTo0xHex,
  validateSecretKeyFormat,
  derivePublicKeyFromSecret,
  generateKeyPair,
  generateChallenge,
  createProof,
  verifyProof
} from '../lib/zkAuth.js';

const router = express.Router();

// --- SIGNUP ---
router.post('/signup', async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) return res.status(400).json({ success:false, error:'username required' });

    if (await Profile.findOne({ username })) {
      return res.json({ success:false, error:'Username already taken' });
    }

    // single source of truth: generate and keep 0x+128-hex secret
    const zk = generateKeyPair();
    const sol = deriveWalletFromZKSecret(zk.secretKey);
    const id = newId();

    await Profile.create({
      _id: id,
      username,
      zk_public_key: zk.publicKey,
      solana_address: sol.publicKey,
      is_online: true,
      last_seen: new Date(),
      message_counter: 0
    });

    // seed a welcome tx
    const ch = generateChallenge();
    const h = ch.split('').reduce((acc, ch) => ((acc<<5)-acc) + ch.charCodeAt(0), 0) >>> 0;
    await Transaction.create({
      user_id: id, type:'receive', amount:500, currency:'USDC',
      from_address:'ZKForge', to_address: sol.publicKey,
      status:'completed', description:'Welcome bonus',
      transaction_hash: `0x${h.toString(16).padStart(16,'0')}`
    });

    const { token, expires } = signSession(id);
    await persistSession(token, id, expires);

    res.json({
      success:true,
      userId: id,
      username,
      publicKey: zk.publicKey,
      solanaAddress: sol.publicKey,
      zkSecretKey: zk.secretKey,           // 0x + 128-hex
      solanaSecretKey: sol.secretKey,      // if you really must return it
      sessionToken: token,
      expiresAt: +expires
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:'Failed to create account' });
  }
});

// --- SIGNIN ---
router.post('/signin', async (req, res) => {
  try {
    const raw = (req.body || {}).zkSecretKey || '';
    const zkSecretKey = normalizeTo0xHex(raw);      // normalize once
    if (!validateSecretKeyFormat(zkSecretKey)) {
      return res.json({ success:false, error:'Invalid secret key format' });
    }

    const pub = derivePublicKeyFromSecret(zkSecretKey);
    const profile = await Profile.findOne({ zk_public_key: pub });
    if (!profile) return res.json({ success:false, error:'Account not found' });

    const ch = generateChallenge();
    const proof = createProof(zkSecretKey, ch);
    if (!verifyProof(proof)) return res.json({ success:false, error:'Authentication failed' });

    profile.last_challenge_nonce = ch;
    profile.last_challenge_time = new Date();
    profile.is_online = true;
    profile.last_seen = new Date();
    await profile.save();

    const { token, expires } = signSession(profile._id);
    await persistSession(token, profile._id, expires);

    res.json({
      success:true,
      userId: profile._id,
      username: profile.username,
      publicKey: profile.zk_public_key,
      solanaAddress: profile.solana_address,
      sessionToken: token,
      expiresAt: +expires
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:'Failed to sign in' });
  }
});

// --- ME ---
router.get('/me', authMiddleware, async (req, res) => {
  const p = await Profile.findById(req.userId).lean();
  if (!p) return res.status(404).json({ success:false, error:'not found' });
  res.json({
    success:true,
    userId: p._id,
    username: p.username,
    publicKey: p.zk_public_key,
    solanaAddress: p.solana_address
  });
});

// (optional) status patch for presence
router.patch('/profiles/me', authMiddleware, async (req, res) => {
  const { is_online, last_seen } = req.body || {};
  const updated = await Profile.findByIdAndUpdate(
    req.userId,
    { ...(is_online!==undefined && { is_online }), ...(last_seen && { last_seen }) },
    { new:true }
  ).lean();
  res.json({ ok:true, user: updated });
});

export default router;
