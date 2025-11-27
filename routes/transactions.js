// 2. routes/transactions.js (Secure transaction hash)
import express from 'express';
import { authMiddleware } from '../lib/auth.js';
import Transaction from '../models/Transaction.js';
import Profile from '../models/Profile.js';
import crypto from 'crypto';

const router = express.Router();

// list my transactions
router.get('/', authMiddleware, async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const txs = await Transaction.find({ user_id: req.userId })
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();

  const transactions = txs.map(t => ({ id: t._id?.toString?.() || t.id, ...t }));
  res.json({ ok: true, transactions });
});

// send USDC (secure hash)
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { recipient, amount } = req.body || {};
    const value = Number(amount);
    if (!recipient || !Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ ok: false, error: 'Invalid recipient or amount' });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await Transaction.countDocuments({ user_id: req.userId, type: 'send', created_at: { $gte: since } });
    if (recent >= 5) return res.status(429).json({ ok: false, error: 'Daily send limit reached' });

    let toProfile = await Profile.findOne({ username: recipient }).lean();
    if (!toProfile) toProfile = await Profile.findOne({ solana_address: recipient }).lean();

    const me = await Profile.findById(req.userId).lean();
    if (!me?.solana_address) return res.status(400).json({ ok: false, error: 'Sender wallet not set' });

    const toAddress = toProfile?.solana_address || recipient;

    // --- Balance Validation ---
    // Calculate total received
    const received = await Transaction.aggregate([
      { $match: { user_id: req.userId, type: 'receive', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalReceived = received[0]?.total || 0;

    // Calculate total sent
    const sent = await Transaction.aggregate([
      { $match: { user_id: req.userId, type: 'send', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalSent = sent[0]?.total || 0;

    const currentBalance = totalReceived - totalSent;

    if (currentBalance < value) {
      return res.status(400).json({ ok: false, error: 'Insufficient funds' });
    }
    // --------------------------

    const challenge = `send:${req.userId}:${toAddress}:${value}:${Date.now()}`;
    const hashBuffer = crypto.createHash('sha256').update(challenge).digest();
    const txHash = '0x' + hashBuffer.toString('hex');

    await Transaction.create({
      user_id: req.userId,
      type: 'send',
      amount: value,
      currency: 'USDC',
      from_address: me.solana_address,
      to_address: toAddress,
      status: 'completed',
      transaction_hash: txHash
    });

    if (toProfile) {
      await Transaction.create({
        user_id: toProfile._id,
        type: 'receive',
        amount: value,
        currency: 'USDC',
        from_address: me.solana_address,
        to_address: toAddress,
        status: 'completed',
        transaction_hash: txHash
      });
    }

    res.json({ ok: true, hash: txHash });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to send' });
  }
});

export default router;
