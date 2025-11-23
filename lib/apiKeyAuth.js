// lib/apiKeyAuth.js
import { verifyApiKeyPair } from './apiKeys.js';

export async function apiKeyAuthMiddleware(req, res, next) {
  try {
    const keyId = req.header('x-api-key') || '';
    const secret = req.header('x-api-secret') || '';

    if (!keyId || !secret) {
      return res.status(401).json({ ok: false, error: 'API key and secret required' });
    }

    const apiKeyDoc = await verifyApiKeyPair(keyId, secret);
    if (!apiKeyDoc) {
      return res.status(401).json({ ok: false, error: 'Invalid API key or secret' });
    }

    // make it look like a normal authenticated user
    req.userId = apiKeyDoc.user_id;
    req.authType = 'apiKey';

    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Failed to authenticate API key' });
  }
}
