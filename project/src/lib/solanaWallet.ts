import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { sha256 } from '@noble/hashes/sha2.js';
import { EncryptionService } from './encryption';

export interface SolanaWalletData {
  publicKey: string;
  secretKey: string;
}

export interface WalletInfo {
  address: string;
  publicKey: string;
}

export class SolanaWalletService {
  static generateWallet(): SolanaWalletData {
    const keypair = Keypair.generate();

    return {
      publicKey: keypair.publicKey.toBase58(),
      secretKey: bs58.encode(keypair.secretKey),
    };
  }

  static deriveWalletFromSeed(seed: Uint8Array): SolanaWalletData {
    if (seed.length !== 32) {
      throw new Error('Seed must be 32 bytes');
    }

    const keypair = Keypair.fromSeed(seed);

    return {
      publicKey: keypair.publicKey.toBase58(),
      secretKey: bs58.encode(keypair.secretKey),
    };
  }

  static deriveWalletFromZKSecret(zkSecretKey: string): SolanaWalletData {
    try {
      const zkSecretBytes = this.parseZKSecretKey(zkSecretKey);

      const seed = sha256(zkSecretBytes).slice(0, 32);

      return this.deriveWalletFromSeed(seed);
    } catch (error) {
      throw new Error('Failed to derive Solana wallet from ZK secret');
    }
  }

  static parseZKSecretKey(secretKey: string): Uint8Array {
    const cleanKey = secretKey.trim();

    if (cleanKey.startsWith('0x') || cleanKey.startsWith('0X')) {
      const hexString = cleanKey.slice(2);
      if (!/^[0-9a-fA-F]+$/.test(hexString)) {
        throw new Error('Invalid hexadecimal format');
      }
      if (hexString.length % 2 !== 0) {
        throw new Error('Invalid hex string length');
      }
      const bytes = new Uint8Array(hexString.length / 2);
      for (let i = 0; i < hexString.length; i += 2) {
        bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
      }
      return bytes;
    }

    return bs58.decode(cleanKey);
  }

  static getWalletInfo(secretKey: string): WalletInfo {
    try {
      const secretKeyBytes = bs58.decode(secretKey);
      const keypair = Keypair.fromSecretKey(secretKeyBytes);

      return {
        address: keypair.publicKey.toBase58(),
        publicKey: keypair.publicKey.toBase58(),
      };
    } catch (error) {
      throw new Error('Invalid Solana secret key');
    }
  }

  static validateSecretKey(secretKey: string): boolean {
    try {
      const decoded = bs58.decode(secretKey);
      return decoded.length === 64;
    } catch (error) {
      return false;
    }
  }

  static validateAddress(address: string): boolean {
    try {
      const decoded = bs58.decode(address);
      return decoded.length === 32;
    } catch (error) {
      return false;
    }
  }

  static shortenAddress(address: string, chars: number = 4): string {
    if (address.length <= chars * 2 + 3) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }
}

export class WalletStorage {
  private static readonly WALLET_KEY = 'solana_wallet_data';
  private static readonly ENCRYPTED_WALLET_KEY = 'encrypted_wallet_data';

  static async saveWallet(walletData: SolanaWalletData, password: string): Promise<void> {
    try {
      const encrypted = await EncryptionService.encrypt(JSON.stringify(walletData), password);
      localStorage.setItem(this.ENCRYPTED_WALLET_KEY, encrypted);
    } catch (error) {
      console.error('Failed to save wallet:', error);
    }
  }

  static async getWallet(password: string): Promise<SolanaWalletData | null> {
    try {
      const encrypted = localStorage.getItem(this.ENCRYPTED_WALLET_KEY);
      if (!encrypted) return null;

      const decrypted = await EncryptionService.decrypt(encrypted, password);
      return JSON.parse(decrypted) as SolanaWalletData;
    } catch (error) {
      console.error('Failed to get wallet:', error);
      return null;
    }
  }

  static clearWallet(): void {
    try {
      localStorage.removeItem(this.ENCRYPTED_WALLET_KEY);
      localStorage.removeItem(this.WALLET_KEY);
    } catch (error) {
      console.error('Failed to clear wallet:', error);
    }
  }

  static hasWallet(): boolean {
    return localStorage.getItem(this.ENCRYPTED_WALLET_KEY) !== null;
  }

  static savePublicInfo(address: string): void {
    try {
      localStorage.setItem(this.WALLET_KEY, address);
    } catch (error) {
      console.error('Failed to save wallet public info:', error);
    }
  }

  static getPublicAddress(): string | null {
    try {
      return localStorage.getItem(this.WALLET_KEY);
    } catch (error) {
      console.error('Failed to get wallet public address:', error);
      return null;
    }
  }
}
