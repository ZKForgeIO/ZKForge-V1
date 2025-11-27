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
  computeStarkAuthPublic,
  verifyStarkAuthProof,
  DEFAULT_STEPS,
  DEFAULT_QUERIES
} from '../lib/zkAuth.js';

import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter: 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, error: 'Too many login attempts, please try again later' }
});

// -----------------
// Auto-migrate helper
// -----------------
async function ensureEd25519Key(profile) {
  if (profile.ed25519_public_key) return profile.ed25519_public_key;

  // Try: old value still in zk_public_key
  try {
    const maybePub = profile.zk_public_key;
    const decoded = bs58.decode(maybePub);
    if (decoded.length === 32) {
      await Profile.updateOne(
        { _id: profile._id },
        { ed25519_public_key: maybePub }
      );
      profile.ed25519_public_key = maybePub;
      console.log('[Auth] migrated old Ed25519 key', profile._id);
      return maybePub;
    }
  } catch {
    // new hex format
  }
  return null;
}

// --- SIGNUP ---
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) {
      return res.status(400).json({ success: false, error: 'username required' });
    }

    if (await Profile.findOne({ username })) {
      return res.json({ success: false, error: 'Username already taken' });
    }

    const zk = generateKeyPair();               // Ed25519 keypair
    const ed25519_public_key = zk.publicKey;    // base58 Ed25519
    const sol = deriveWalletFromZKSecret(zk.secretKey);

    const { finalHashHex, params } = computeStarkAuthPublic(
      zk.secretKey,
      DEFAULT_STEPS,
      DEFAULT_QUERIES
    );

    const id = newId();

    await Profile.create({
      _id: id,
      username,

      ed25519_public_key,       // lounge encryption
      zk_public_key: finalHashHex, // zkSTARK public commitment
      zk_auth_steps: params.steps,
      zk_auth_queries: params.queries,

      solana_address: sol.publicKey,
      is_online: true,
      last_seen: new Date(),
      message_counter: 0
    });

    // Welcome TX
    const ch = generateChallenge();
    const h = ch.split('').reduce((acc, ch) => ((acc << 5) - acc) + ch.charCodeAt(0), 0) >>> 0;

    await Transaction.create({
      user_id: id,
      type: 'receive',
      amount: 500,
      currency: 'USDC',
      from_address: 'ZKForge',
      to_address: sol.publicKey,
      status: 'completed',
      description: 'Welcome bonus',
      transaction_hash: `0x${h.toString(16).padStart(16, '0')}`
    });

    const { token, expires } = signSession(id);
    await persistSession(token, id, expires);

    res.json({
      success: true,
      userId: id,
      username,

      zkPublicKey: finalHashHex,
      zkAuthSteps: params.steps,
      zkAuthQueries: params.queries,

      publicKey: ed25519_public_key, // base58
      solanaAddress: sol.publicKey,

      zkSecretKey: zk.secretKey,
      solanaSecretKey: sol.secretKey,

      sessionToken: token,
      expiresAt: +expires
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Failed to create account' });
  }
});

// --- SIGNIN (zkSTARK-based)
router.post('/signin', authLimiter, async (req, res) => {
  try {
    const { username, zkSecretKey } = req.body || {};

    if (!username || !zkSecretKey) {
      return res.status(400).json({
        success: false,
        error: "username and zkSecretKey are required"
      });
    }

    const profile = await Profile.findOne({ username });
    if (!profile)
      return res.json({ success: false, error: "Account not found" });

    // auto-migrate old Ed25519 key
    await ensureEd25519Key(profile);

    // convert user-entered secret key → 64-byte expanded secret
    const normalized = normalizeTo0xHex(zkSecretKey);

    // recompute the final hash (public commitment) using stored params
    const { finalHashHex } = computeStarkAuthPublic(
      normalized,
      profile.zk_auth_steps || DEFAULT_STEPS,
      profile.zk_auth_queries || DEFAULT_QUERIES
    );

    // compare against stored commitment
    if (finalHashHex !== profile.zk_public_key) {
      return res.json({ success: false, error: "Authentication failed" });
    }

    profile.is_online = true;
    profile.last_seen = new Date();
    await profile.save();

    const { token, expires } = signSession(profile._id);
    await persistSession(token, profile._id, expires);

    return res.json({
      success: true,
      userId: profile._id,
      username: profile.username,
      zkPublicKey: profile.zk_public_key,
      zkAuthSteps: profile.zk_auth_steps,
      zkAuthQueries: profile.zk_auth_queries,
      solanaAddress: profile.solana_address,
      sessionToken: token,
      expiresAt: +expires
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: "Failed to sign in" });
  }
});


// --- ME ---
router.get('/me', authMiddleware, async (req, res) => {
  const p = await Profile.findById(req.userId).lean();
  if (!p)
    return res.status(404).json({ success: false, error: 'not found' });

  await ensureEd25519Key(p);

  res.json({
    success: true,
    userId: p._id,
    username: p.username,
    zkPublicKey: p.zk_public_key,
    zkAuthSteps: p.zk_auth_steps || DEFAULT_STEPS,
    zkAuthQueries: p.zk_auth_queries || DEFAULT_QUERIES,
    solanaAddress: p.solana_address
  });
});

// --- PATCH /profiles/me ---
router.patch('/profiles/me', authMiddleware, async (req, res) => {
  const { is_online, last_seen } = req.body || {};
  const updated = await Profile.findByIdAndUpdate(
    req.userId,
    { ...(is_online !== undefined && { is_online }), ...(last_seen && { last_seen }) },
    { new: true }
  ).lean();
  res.json({ ok: true, user: updated });
});

export default router;
