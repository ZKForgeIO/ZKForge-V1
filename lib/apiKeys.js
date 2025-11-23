// lib/apiKeys.js
import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';

const API_KEY_PREFIX = 'xk_';
const API_SECRET_PREFIX = 'xs_';

function hashSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export async function createApiKeyForUser(userId) {
  const keyId = API_KEY_PREFIX + crypto.randomBytes(16).toString('hex');  // public
  const secret = API_SECRET_PREFIX + crypto.randomBytes(32).toString('hex'); // private

  const secretHash = hashSecret(secret);

  const doc = await ApiKey.create({
    user_id: userId,
    key_id: keyId,
    secret_hash: secretHash,
    is_active: true
  });

  // only time we ever return the secret
  return {
    keyId: doc.key_id,
    secret
  };
}

export async function findActiveKeyById(keyId) {
  return ApiKey.findOne({ key_id: keyId, is_active: true });
}

export async function verifyApiKeyPair(keyId, secret) {
  const doc = await findActiveKeyById(keyId);
  if (!doc) return null;

  const hashed = hashSecret(secret);
  if (hashed !== doc.secret_hash) return null;

  doc.last_used_at = new Date();
  await doc.save();

  return doc;
}

export async function deactivateAllKeysForUser(userId) {
  await ApiKey.updateMany(
    { user_id: userId, is_active: true },
    { is_active: false }
  );
}
