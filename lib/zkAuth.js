// lib/zkAuth.js
//
// zkSTARK-style authentication helpers for the backend.
//
// - Generates a long random secret (Ed25519 secretKey) used as:
//    * seed for Solana wallet derivation (existing code)
//    * witness for zkSTARK-style auth
// - Computes a public commitment (final hash of a hash-chain) from the secret.
// - Verifies zkSTARK auth proofs coming from the client.
//
// NOTE: This is an experimental, educational implementation,
//       not a production-grade cryptographic library.

import nacl from 'tweetnacl';
import bs58 from 'bs58';
import {
  createField,
  fieldElementToBytes,
  fieldElementFromBytes,
  buildAuthTrace,
  StarkVerifier,
  MerkleProof
} from '@zkforge/zkstark';

// ---------- helpers ----------
const enc = new TextEncoder();
export const isHex = (s) => /^[0-9a-fA-F]+$/.test(s || '');
export const strip0x = (s = '') => (s.startsWith('0x') || s.startsWith('0X')) ? s.slice(2) : s;

// --- Secret key normalization (kept for Solana + backward compatibility) ---

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
  } catch { }
  return '';
}

/** Parse to 64-byte Uint8Array (expanded Ed25519 secret) */
export function parseSecretKey(secret) {
  const norm = normalizeTo0xHex(secret);
  if (!norm) throw new Error('Invalid secret key');
  const hex = strip0x(norm);
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  if (out.length !== 64) throw new Error('Expected 64 bytes');
  return out;
}

export function validateSecretKeyFormat(secret) {
  try { return parseSecretKey(secret).length === 64; } catch { return false; }
}

/** Generate brand-new Ed25519 keypair (publicKey base58, secretKey 0x+128-hex) */
export function generateKeyPair() {
  const kp = nacl.sign.keyPair();                // 32-byte seed, 64-byte secretKey
  const secretKey = '0x' + Buffer.from(kp.secretKey).toString('hex');
  const publicKey = bs58.encode(kp.publicKey);
  return { publicKey, secretKey };
}

/** Derive Ed25519 public key from secret (kept for compatibility/UI) */
export function derivePublicKeyFromSecret(secret) {
  const sk = parseSecretKey(secret);
  const kp = nacl.sign.keyPair.fromSecretKey(sk);
  return bs58.encode(kp.publicKey);
}

/** Simple random challenge (used for welcome tx hash only, not auth) */
export function generateChallenge() {
  return bs58.encode(nacl.randomBytes(32));
}

// ---------- zkSTARK-style auth helpers ----------

export const DEFAULT_STEPS = 16;
export const DEFAULT_QUERIES = 5;

/** Convert a 0x+128-hex secret into a field element (witness) */
export function secretHexToField(secretHex) {
  const norm = normalizeTo0xHex(secretHex);
  if (!norm) {
    throw new Error('Invalid secret key for zkSTARK auth');
  }
  const clean = strip0x(norm);
  const big = BigInt('0x' + clean);
  return createField(big);
}

/**
 * Compute the public zkSTARK commitment (final hash) from a secret.
 * This is what the backend will store and later use to verify proofs.
 *
 * Returns:
 *   {
 *     finalHashHex: '0x' + 64-hex,
 *     params: { steps, queries }
 *   }
 */
export function computeStarkAuthPublic(secretHex, steps = DEFAULT_STEPS, queries = DEFAULT_QUERIES) {
  const secretFe = secretHexToField(secretHex);
  const params = { steps, queries };
  const trace = buildAuthTrace({ secret: secretFe }, params);
  const finalHash = trace[steps - 1];
  const finalHashHex = '0x' + Buffer.from(fieldElementToBytes(finalHash)).toString('hex');
  return { finalHashHex, params };
}

/** Helper: hex string -> Uint8Array */
function hexToBytes(hex) {
  if (!hex || typeof hex !== 'string') throw new Error('Expected hex string');
  const clean = strip0x(hex);
  return new Uint8Array(Buffer.from(clean, 'hex'));
}

/** Helper: Uint8Array -> 0x-hex string */
function bytesToHex(bytes) {
  return '0x' + Buffer.from(bytes).toString('hex');
}

/**
 * Deserialize a JSON proof from the client into the internal Proof shape
 * used by @zkforge/zkstark's StarkVerifier.
 *
 * Expected JSON shape:
 *
 * {
 *   root: "0x...",
 *   indices: [number, ...],
 *   openings: [
 *     {
 *       index: number,
 *       current: "0x...",   // field element encoded via fieldElementToBytes
 *       next: "0x...",
 *       proofCurrent: {
 *         leaf: "0x...",
 *         proof: [{ hash: "0x...", position: "left" | "right" }, ...],
 *         root: "0x..."
 *       },
 *       proofNext: { ... }
 *     }
 *   ]
 * }
 */
export function deserializeProof(jsonProof) {


  if (!jsonProof || typeof jsonProof !== 'object') {
    throw new Error('Invalid proof payload');
  }

  const root = hexToBytes(jsonProof.root);
  const indices = Array.isArray(jsonProof.indices) ? jsonProof.indices.slice() : [];

  const openings = (jsonProof.openings || []).map((o) => {
    const currentFe = fieldElementFromBytes(hexToBytes(o.current));
    const nextFe = fieldElementFromBytes(hexToBytes(o.next));

    const pc = o.proofCurrent;
    const pn = o.proofNext;

    const proofCurrent = new MerkleProof(
      hexToBytes(pc.leaf),
      pc.proof.map((p) => ({
        hash: hexToBytes(p.hash),
        position: p.position
      })),
      hexToBytes(pc.root)
    );

    const proofNext = new MerkleProof(
      hexToBytes(pn.leaf),
      pn.proof.map((p) => ({
        hash: hexToBytes(p.hash),
        position: p.position
      })),
      hexToBytes(pn.root)
    );

    return {
      index: o.index,
      current: currentFe,
      next: nextFe,
      proofCurrent,
      proofNext
    };
  });

  return { root, indices, openings };
}

/**
 * Verify a zkSTARK-style auth proof for a given stored commitment.
 *
 * finalHashHex: the 0x-hex commitment stored in Profile.zk_public_key
 * rawProof: JSON object as described in deserializeProof() docs
 * paramsOverride: optional { steps, queries }
 */
export function verifyStarkAuthProof(finalHashHex, rawProof, paramsOverride = {}) {
  const steps = paramsOverride.steps || DEFAULT_STEPS;
  const queries = paramsOverride.queries || DEFAULT_QUERIES;

  const finalBytes = hexToBytes(finalHashHex);
  const finalHash = fieldElementFromBytes(finalBytes);

  const statement = { steps, finalHash };
  const params = { steps, queries };

  const proof = deserializeProof(rawProof);
  const verifier = new StarkVerifier(statement, params);
  return verifier.verify(proof);
}

// Also export for convenience in routes/auth.js
export { bytesToHex };
