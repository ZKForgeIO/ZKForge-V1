// src/lib/roomCrypto.ts
import nacl from 'tweetnacl';
import ed2curve from 'ed2curve';
import bs58 from 'bs58';
import { ZKAuthService } from './zkAuth';

let ROOM_KEY: Uint8Array | null = null;

export function haveRoomKey() { return !!ROOM_KEY; }
export function clearRoomKey() { ROOM_KEY = null; }

export function edSecretToEdPair(secretHexOr0x: string) {
  // parse as in your ZKAuthService.parseSecretKey
  const bytes = ZKAuthService.parseSecretKey(secretHexOr0x); // Uint8Array(64) expanded
  const kp = nacl.sign.keyPair.fromSecretKey(bytes);
  return kp; // { publicKey(32), secretKey(64) }
}

export function edToCurve(edPair: nacl.SignKeyPair) {
  const curveSk = ed2curve.convertSecretKey(edPair.secretKey);
  const curvePk = ed2curve.convertPublicKey(edPair.publicKey);
  if (!curveSk || !curvePk) throw new Error('ed2curve conversion failed');
  return { curvePk, curveSk };
}

export function signBytes(edPair: nacl.SignKeyPair, data: Uint8Array) {
  return nacl.sign.detached(data, edPair.secretKey);
}

export function setRoomKeyBytes(k: Uint8Array) {
  if (k.length !== 32) throw new Error('room key must be 32 bytes');
  ROOM_KEY = new Uint8Array(k);
}

export function encryptRoomMessage(plain: string) {
  if (!ROOM_KEY) throw new Error('room key not ready');
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const msg = new TextEncoder().encode(plain);
  const ct = nacl.secretbox(msg, nonce, ROOM_KEY);
  return { nonce, ct };
}

export function decryptRoomMessage(nonce_b58: string, ciphertext_b58: string): string | null {
  if (!ROOM_KEY) return null;
  const nonce = bs58.decode(nonce_b58);
  const ct = bs58.decode(ciphertext_b58);
  const out = nacl.secretbox.open(ct, nonce, ROOM_KEY);
  if (!out) return null;
  return new TextDecoder().decode(out);
}

// Unseal room key using user’s Ed25519 secret (converted to curve25519)
export function unsealRoomKey(ephPub_b58: string, nonce_b58: string, sealed_b58: string, edPair: nacl.SignKeyPair) {
  const ephPub = bs58.decode(ephPub_b58);
  const nonce = bs58.decode(nonce_b58);
  const sealed = bs58.decode(sealed_b58);

  const curveSk = ed2curve.convertSecretKey(edPair.secretKey);
  if (!curveSk) throw new Error('ed2curve: secret conversion failed');

  const roomKey = nacl.box.open(sealed, nonce, ephPub, curveSk);
  if (!roomKey) throw new Error('failed to unseal room key');
  setRoomKeyBytes(roomKey);
}
