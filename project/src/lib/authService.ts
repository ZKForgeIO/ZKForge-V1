// drop-in replacement for your previous Supabase-based service
import { ZKAuthService, ZKKeyPair } from './zkAuth';
import { SolanaWalletService, SolanaWalletData, WalletStorage } from './solanaWallet';
import { EncryptionService } from './encryption';

export interface AuthResult {
  success: boolean;
  userId?: string;
  username?: string;
  publicKey?: string;
  solanaAddress?: string;
  error?: string;
  zkSecretKey?: string;
  solanaSecretKey?: string;
  sessionToken?: string;
}

type StoredAuthData = { userId: string; publicKey: string; sessionToken: string; expiresAt: number };

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.zkforge.io';
if (!API_BASE.startsWith('https://')) {
  console.error('Security Error: API_BASE must use HTTPS');
  // In production, we might want to throw, but for dev we might allow http if explicitly needed, 
  // but the audit requires validation.
  if (import.meta.env.PROD) {
    throw new Error('API_BASE must be HTTPS');
  }
}

export const AuthStorage = {
  saveAuthData(d: StoredAuthData) { localStorage.setItem('auth', JSON.stringify(d)); },
  getAuthData(): StoredAuthData | null { try { return JSON.parse(localStorage.getItem('auth') || 'null'); } catch { return null; } },
  clearAuthData() { localStorage.removeItem('auth'); },
  // ZK Secret is now encrypted too? The audit said "ZK secret keys and Solana wallet private keys".
  // The plan said "Update AuthStorage to encrypt zkSecretKey".
  // So we need to change saveSecretKey/getSecretKey to async and take password.
  // However, this interface is synchronous usage in many places.
  // Refactoring to async might be large.
  // Let's check usages of AuthStorage.saveSecretKey/getSecretKey.
  // It is used in Chat.tsx:121 synchronously: const zk = AuthStorage.getSecretKey();
  // This means Chat.tsx needs refactoring to async or we need to cache the decrypted key in memory after login.
  // For now, let's keep the interface but implementation will need to change.
  // Wait, if I change it to async, I break Chat.tsx.
  // I should probably cache the decrypted key in memory in AuthService upon login, 
  // and AuthStorage.getSecretKey() should retrieve from memory?
  // Or better, AuthStorage.getSecretKey() remains as is (retrieving from localStorage), 
  // but we change the storage to be encrypted. 
  // But if it's encrypted in LS, getSecretKey() returning the raw value means the caller gets encrypted data.
  // The caller (Chat.tsx) expects the raw key.
  // So Chat.tsx MUST call a decrypt function.

  // Let's look at the plan: "Update AuthStorage to encrypt zkSecretKey".
  // And "Update Auth.tsx to add Password/PIN".

  // I will modify AuthStorage to store encrypted data.
  // I will add `saveSecretKey(sk, password)` and `getSecretKey(password)`.
  // I will update Chat.tsx to handle this.

  async saveSecretKey(sk: string, password: string) {
    const enc = await EncryptionService.encrypt(sk, password);
    localStorage.setItem('zkSecret', enc);
  },
  async getSecretKey(password: string): Promise<string | null> {
    const enc = localStorage.getItem('zkSecret');
    if (!enc) return null;
    try {
      return await EncryptionService.decrypt(enc, password);
    } catch { return null; }
  }
};

export class AuthService {
  // In-memory cache for the session to avoid re-prompting for password on every getSecretKey call
  // if we were to use it that way. But Chat.tsx calls it.
  // We might need a SessionState.

  static async signUp(username: string, password: string): Promise<AuthResult> {
    try {
      const r = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const res = await r.json();
      if (!res.success) return { success: false, error: res.error || 'Signup failed' };

      const auth: StoredAuthData = {
        userId: res.userId,
        publicKey: res.publicKey,
        sessionToken: res.sessionToken,
        expiresAt: res.expiresAt
      };
      AuthStorage.saveAuthData(auth);
      await AuthStorage.saveSecretKey(res.zkSecretKey, password);

      const wallet: SolanaWalletData = { publicKey: res.solanaAddress, secretKey: res.solanaSecretKey };
      await WalletStorage.saveWallet(wallet, password);
      WalletStorage.savePublicInfo(wallet.publicKey);

      return {
        success: true,
        userId: res.userId,
        username: res.username,
        publicKey: res.publicKey,
        solanaAddress: res.solanaAddress,
        zkSecretKey: res.zkSecretKey,
        solanaSecretKey: res.solanaSecretKey,
        sessionToken: res.sessionToken
      };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to create account' };
    }
  }

  static async signIn(username: string, zkSecretKey: string, password: string): Promise<AuthResult> {
    try {
      const r = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, zkSecretKey })
      });
      const res = await r.json();
      if (!res.success) return { success: false, error: res.error || 'Failed to sign in' };

      const auth: StoredAuthData = {
        userId: res.userId,
        publicKey: res.publicKey,
        sessionToken: res.sessionToken,
        expiresAt: res.expiresAt
      };
      AuthStorage.saveAuthData(auth);
      await AuthStorage.saveSecretKey(zkSecretKey, password); // zkSecretKey is used as zkProof

      const solanaWallet = SolanaWalletService.deriveWalletFromZKSecret(zkSecretKey);
      await WalletStorage.saveWallet(solanaWallet, password);
      WalletStorage.savePublicInfo(solanaWallet.publicKey);

      return {
        success: true,
        userId: res.userId,
        username: res.username,
        publicKey: res.publicKey,
        solanaAddress: res.solanaAddress,
        sessionToken: res.sessionToken
      };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to sign in' };
    }
  }

  static async signOut(): Promise<void> {
    AuthStorage.clearAuthData();
    WalletStorage.clearWallet?.();
  }

  static async getCurrentUser(): Promise<AuthResult | null> {
    const auth = AuthStorage.getAuthData();
    if (!auth) return null;
    try {
      const r = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${auth.sessionToken}` }
      });
      const res = await r.json();
      if (!res.success) { AuthStorage.clearAuthData(); return null; }
      return { success: true, userId: res.userId, username: res.username, publicKey: res.publicKey, solanaAddress: res.solanaAddress };
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    const a = AuthStorage.getAuthData();
    return !!a && a.expiresAt > Date.now();
  }

  static async updateProfile(_userId: string, updates: { is_online?: boolean; last_seen?: string }): Promise<boolean> {
    try {
      const auth = AuthStorage.getAuthData(); if (!auth) return false;
      const r = await fetch(`${API_BASE}/auth/profiles/me`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${auth.sessionToken}` },
        body: JSON.stringify(updates)
      });
      const res = await r.json();
      return !!res.ok;
    } catch { return false; }
  }
}

export const ApiClient = {
  base: API_BASE,
  token(): string | null { return AuthStorage.getAuthData()?.sessionToken || null; },
  async get(path: string) {
    const r = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${this.token()}` } });
    return r.json();
  },
  async post(path: string, body?: any) {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${this.token()}` },
      body: body ? JSON.stringify(body) : undefined
    });
    return r.json();
  },
  async patch(path: string, body?: any) {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${this.token()}` },
      body: body ? JSON.stringify(body) : undefined
    });
    return r.json();
  }
};
