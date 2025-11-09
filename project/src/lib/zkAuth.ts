import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { sha256 } from '@noble/hashes/sha2.js';

function encodeUTF8(str: string): Uint8Array { return new TextEncoder().encode(str); }
function decodeUTF8(bytes: Uint8Array): string { return new TextDecoder().decode(bytes); }

export interface ZKKeyPair {
  publicKey: string;   // base58
  secretKey: string;   // 0x + 128-hex (64 bytes)
}

export interface ZKProof {
  publicKey: string;   // base58
  signature: string;   // base58
  challenge: string;
  timestamp: number;
}

export class ZKAuthService {
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) throw new Error('Invalid hex length');
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    return out;
  }

  /** Always generate 64-byte expanded secret as 0x + 128-hex (matches old UX) */
  static generateKeyPair(): ZKKeyPair {
    const kp = nacl.sign.keyPair(); // random seed internally, returns 64-byte secretKey
    return {
      publicKey: bs58.encode(kp.publicKey),
      secretKey: '0x' + this.bytesToHex(kp.secretKey),
    };
  }

  static generateChallenge(): string {
    const randomBytes = nacl.randomBytes(32);
    return bs58.encode(randomBytes);
  }

  static createProof(secretKey: string, challenge: string): ZKProof {
    const sk64 = this.parseSecretKey(secretKey); // always 64 bytes after parse
    const kp = nacl.sign.keyPair.fromSecretKey(sk64);

    const timestamp = Date.now();
    const message = `${challenge}:${timestamp}`;
    const sig = nacl.sign.detached(encodeUTF8(message), sk64);

    return {
      publicKey: bs58.encode(kp.publicKey),
      signature: bs58.encode(sig),
      challenge,
      timestamp,
    };
  }

  static verifyProof(proof: ZKProof): boolean {
    try {
      const pk = bs58.decode(proof.publicKey);
      const sig = bs58.decode(proof.signature);
      const msg = encodeUTF8(`${proof.challenge}:${proof.timestamp}`);
      const isValid = nacl.sign.detached.verify(msg, sig, pk);
      const isRecent = Date.now() - proof.timestamp < 5 * 60 * 1000;
      return isValid && isRecent;
    } catch {
      return false;
    }
  }

  static derivePublicKeyFromSecret(secretKey: string): string {
    const sk64 = this.parseSecretKey(secretKey);
    const kp = nacl.sign.keyPair.fromSecretKey(sk64);
    return bs58.encode(kp.publicKey);
  }

  /**
   * Parse secret in multiple formats and return a 64-byte expanded secret key.
   * Accepted inputs:
   *  - 0x + 128-hex  => 64-byte expanded secret
   *  - 0x + 64-hex   => 32-byte seed, expanded to 64-byte secret
   *  - 128-hex       => 64-byte expanded secret
   *  - 64-hex        => 32-byte seed, expanded
   *  - base58        => treated as 64-byte expanded secret (legacy)
   */
  static parseSecretKey(input: string): Uint8Array {
    const clean = input.trim();
    const is0x = clean.startsWith('0x') || clean.startsWith('0X');
    const hex = is0x ? clean.slice(2) : clean;

    // Hex?
    if (/^[0-9a-fA-F]+$/.test(hex)) {
      if (hex.length === 128) {
        // 64-byte expanded secret (old format)
        const sk = this.hexToBytes(hex);
        if (sk.length !== 64) throw new Error('Invalid expanded secret length');
        return sk;
      }
      if (hex.length === 64) {
        // 32-byte seed -> expand
        const seed = this.hexToBytes(hex);
        if (seed.length !== 32) throw new Error('Invalid seed length');
        const kp = nacl.sign.keyPair.fromSeed(seed);
        return kp.secretKey; // 64 bytes
      }
      throw new Error('Invalid hex length (expected 64 or 128 hex chars)');
    }

    // Base58 (legacy)
    try {
      const raw = bs58.decode(clean);
      if (raw.length === 64) return raw;
      if (raw.length === 32) {
        const kp = nacl.sign.keyPair.fromSeed(raw);
        return kp.secretKey;
      }
      throw new Error('Invalid base58 key length');
    } catch {
      throw new Error('Invalid secret key format');
    }
  }

  /** Hash over the canonical 64-byte expanded secret */
  static hashSecretKey(secretKey: string): Uint8Array {
    const sk64 = this.parseSecretKey(secretKey);
    return sha256(sk64);
  }

  /** Validate by parsing and ensuring we end up with 64 bytes */
  static validateSecretKeyFormat(secretKey: string): boolean {
    try {
      return this.parseSecretKey(secretKey).length === 64;
    } catch {
      return false;
    }
  }

  /** Normalize any accepted input to display as 0x + 128-hex */
  static normalizeTo0xHex(secretKey: string): string {
    const sk64 = this.parseSecretKey(secretKey);
    return '0x' + this.bytesToHex(sk64);
  }

  static formatSecretKeyForDisplay(secretKey: string): string {
    const s = secretKey.startsWith('0x') ? secretKey : this.normalizeTo0xHex(secretKey);
    const hexPart = s.slice(2);
    if (hexPart.length <= 16) return s;
    const chunk = 16;
    const chunks: string[] = ['0x'];
    for (let i = 0; i < hexPart.length; i += chunk) chunks.push(hexPart.slice(i, i + chunk));
    return chunks.join(' ');
  }

  static unformatSecretKey(formattedKey: string): string {
    return formattedKey.replace(/\s+/g, '');
  }
}

/** unchanged */
export interface StoredAuthData {
  userId: string;
  publicKey: string;
  sessionToken: string;
  expiresAt: number;
}

export class AuthStorage {
  private static readonly AUTH_KEY = 'zk_auth_data';
  private static readonly SECRET_KEY = 'zk_secret_key';

  static saveAuthData(data: StoredAuthData): void {
    try { localStorage.setItem(this.AUTH_KEY, JSON.stringify(data)); } catch {}
  }
  static getAuthData(): StoredAuthData | null {
    try {
      const data = localStorage.getItem(this.AUTH_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data) as StoredAuthData;
      if (parsed.expiresAt < Date.now()) { this.clearAuthData(); return null; }
      return parsed;
    } catch { return null; }
  }
  static clearAuthData(): void { try {
    localStorage.removeItem(this.AUTH_KEY); localStorage.removeItem(this.SECRET_KEY);
  } catch {} }
  static saveSecretKey(secretKey: string): void {
    try { localStorage.setItem(this.SECRET_KEY, ZKAuthService.normalizeTo0xHex(secretKey)); } catch {}
  }
  static getSecretKey(): string | null {
    try { return localStorage.getItem(this.SECRET_KEY); } catch { return null; }
  }
  static hasSecretKey(): boolean { return this.getSecretKey() !== null; }
}
