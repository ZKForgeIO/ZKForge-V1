import express from 'express';
import { authMiddleware } from '../lib/auth.js';
import { proveIncrement, verifyIncrement, bigintToString, reviveBigInts } from '../stark/counterStark.js';
import Profile from '../models/Profile.js';

const router = express.Router();

/**
 * Client asks for the next-proof. We:
 *  - read user's current counter (BigInt-safe)
 *  - build proof for (prev -> prev+1)
 *  - return strings for BigInts so JSON is happy
 */
router.post('/next-proof', authMiddleware, async (req, res) => {
  try {
    const me = await Profile.findById(req.userId).lean();
    const prev = BigInt(me?.message_counter ?? 0);
    const next = prev + 1n;

    const bundle = proveIncrement(prev, next);
    // IMPORTANT: JSON cannot carry BigInt; send as strings
    return res.json({
      ok: true,
      proofBundle: bigintToString(bundle)
    });
  } catch (e) {
    console.error('[stark/next-proof] error', e);
    return res.status(500).json({ ok: false, error: 'failed_to_generate_proof' });
  }
});

/**
 * Optional: a verifier endpoint if you need server-side checking (we already verify inside /chat/messages).
 */
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { assertions, proof } = reviveBigInts(req.body || {});
    const ok = verifyIncrement(assertions, proof);
    return res.json({ ok });
  } catch (e) {
    console.error('[stark/verify] error', e);
    return res.status(400).json({ ok: false, error: 'invalid_payload' });
  }
});

export default router;
