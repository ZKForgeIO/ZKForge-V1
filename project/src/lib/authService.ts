// drop-in replacement for your previous Supabase-based service
import { ZKAuthService, ZKKeyPair } from './zkAuth';
import { SolanaWalletService, SolanaWalletData, WalletStorage } from './solanaWallet';

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

export const AuthStorage = {
  saveAuthData(d: StoredAuthData) { localStorage.setItem('auth', JSON.stringify(d)); },
  getAuthData(): StoredAuthData | null { try { return JSON.parse(localStorage.getItem('auth') || 'null'); } catch { return null; } },
  clearAuthData() { localStorage.removeItem('auth'); },
  saveSecretKey(sk: string) { localStorage.setItem('zkSecret', sk); },
  getSecretKey(): string | null { return localStorage.getItem('zkSecret'); }
};

export class AuthService {
  static async signUp(username: string): Promise<AuthResult> {
    try {
      const r = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const res = await r.json();
      if (!res.success) return { success:false, error: res.error || 'Signup failed' };

      const auth: StoredAuthData = {
        userId: res.userId,
        publicKey: res.publicKey,
        sessionToken: res.sessionToken,
        expiresAt: res.expiresAt
      };
      AuthStorage.saveAuthData(auth);
      AuthStorage.saveSecretKey(res.zkSecretKey);
      const wallet: SolanaWalletData = { publicKey: res.solanaAddress, secretKey: res.solanaSecretKey };
      WalletStorage.saveWallet(wallet);
      WalletStorage.savePublicInfo(wallet.publicKey);

      return {
        success:true,
        userId: res.userId,
        username: res.username,
        publicKey: res.publicKey,
        solanaAddress: res.solanaAddress,
        zkSecretKey: res.zkSecretKey,
        solanaSecretKey: res.solanaSecretKey,
        sessionToken: res.sessionToken
      };
    } catch (e:any) {
      return { success:false, error: e?.message || 'Failed to create account' };
    }
  }
static async signIn(username: string, zkSecretKey: string): Promise<AuthResult> {
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
    AuthStorage.saveSecretKey(zkSecretKey); // zkSecretKey is used as zkProof

    const solanaWallet = SolanaWalletService.deriveWalletFromZKSecret(zkSecretKey);
    WalletStorage.saveWallet(solanaWallet);
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
      return { success:true, userId: res.userId, username: res.username, publicKey: res.publicKey, solanaAddress: res.solanaAddress };
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
    const r = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${this.token()}` }});
    return r.json();
  },
  async post(path: string, body?: any) {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type':'application/json', Authorization: `Bearer ${this.token()}` },
      body: body ? JSON.stringify(body) : undefined
    });
    return r.json();
  },
  async patch(path: string, body?: any) {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'content-type':'application/json', Authorization: `Bearer ${this.token()}` },
      body: body ? JSON.stringify(body) : undefined
    });
    return r.json();
  }
};
