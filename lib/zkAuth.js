// lib/zkAuth.js
import nacl from 'tweetnacl';
import bs58 from 'bs58';

// ---------- helpers ----------
const enc = new TextEncoder();
export const isHex = (s) => /^[0-9a-fA-F]+$/.test(s || '');
export const strip0x = (s='') => (s.startsWith('0x') || s.startsWith('0X')) ? s.slice(2) : s;

/** Normalize any accepted input to canonical 0x + 128-hex (64 bytes) */
export function normalizeTo0xHex(secret) {
  if (!secret || typeof secret !== 'string') return '';
  const clean = secret.trim();

  // already 0x + 128-hex
  if ((clean.startsWith('0x') || clean.startsWith('0X')) && strip0x(clean).length === 128 && isHex(strip0x(clean))) {
    return '0x' + strip0x(clean).toLowerCase();
  }
  // bare 128-hex
  if (clean.length === 128 && isHex(clean)) {
    return '0x' + clean.toLowerCase();
  }
  // legacy base58 (64 bytes)
  try {
    const b = bs58.decode(clean);
    if (b.length === 64) return '0x' + Buffer.from(b).toString('hex');
  } catch {}
  return '';
}

/** Parse to 64-byte Uint8Array (expanded Ed25519 secret) */
export function parseSecretKey(secret) {
  const norm = normalizeTo0xHex(secret);
  if (!norm) throw new Error('Invalid secret key');
  const hex = strip0x(norm);
  const out = new Uint8Array(hex.length / 2);
  for (let i=0; i<hex.length; i+=2) out[i/2] = parseInt(hex.slice(i,i+2), 16);
  if (out.length !== 64) throw new Error('Expected 64 bytes');
  return out;
}

export function validateSecretKeyFormat(secret) {
  try { return parseSecretKey(secret).length === 64; } catch { return false; }
}

/** Generate brand-new keypair (returns publicKey base58, secretKey 0x+128-hex) */
export function generateKeyPair() {
  const kp = nacl.sign.keyPair();                // 32-byte seed, 64-byte secretKey
  const secretKey = '0x' + Buffer.from(kp.secretKey).toString('hex');
  const publicKey = bs58.encode(kp.publicKey);
  return { publicKey, secretKey };
}

export function derivePublicKeyFromSecret(secret) {
  const sk = parseSecretKey(secret);
  const kp = nacl.sign.keyPair.fromSecretKey(sk);
  return bs58.encode(kp.publicKey);
}

export function generateChallenge() {
  return bs58.encode(nacl.randomBytes(32));
}

export function createProof(secret, challenge) {
  const sk = parseSecretKey(secret);
  const kp = nacl.sign.keyPair.fromSecretKey(sk);
  const timestamp = Date.now();
  const msg = enc.encode(`${challenge}:${timestamp}`);
  const sig = nacl.sign.detached(msg, sk);
  return {
    publicKey: bs58.encode(kp.publicKey),
    signature: bs58.encode(sig),
    challenge,
    timestamp
  };
}

export function verifyProof(proof) {
  try {
    const pk = bs58.decode(proof.publicKey);
    const sig = bs58.decode(proof.signature);
    const msg = enc.encode(`${proof.challenge}:${proof.timestamp}`);
    const ok = nacl.sign.detached.verify(msg, sig, pk);
    const recent = (Date.now() - proof.timestamp) < 5 * 60 * 1000;
    return ok && recent;
  } catch {
    return false;
  }
}
