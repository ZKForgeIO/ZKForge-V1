// src/lib/wsClient.ts
import { ApiClient, AuthStorage } from './authService';

type Handler = (payload: any) => void;

const WS_BASE = "wss://api.zkforge.io/ws"


const CHANNEL_NAME = 'zkchat-ws';
const LEADER_KEY = 'zkchat_ws_leader';
const LOCK_TTL_MS = 6000;      // leader lock refresh window
const HEARTBEAT_MS = 2000;     // leader lock refresh cadence
const RECONNECT_MIN = 1000;
const RECONNECT_MAX = 8000;

class WSBus {
  private ws: WebSocket | null = null;
  private bc = new BroadcastChannel(CHANNEL_NAME);
  private handlers = new Map<string, Set<Handler>>();
  private isLeader = false;
  private leaderId = crypto.randomUUID();
  private hbTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private backoff = RECONNECT_MIN;

  constructor() {
    // followers receive frames from leader tab
    this.bc.onmessage = (ev) => {
      const msg = ev.data;
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === '__leader_ping__') {
        // followers see leader as alive
        return;
      }
      if (msg.type === '__leader_claim__') {
        // ignore; we rely on storage lock
        return;
      }
      // forward real WS events to local subscribers
      if (msg.type && msg.payload !== undefined) {
        this.emit(msg.type, msg.payload);
      }
    };

    // Try to become leader on load
    this.tryBecomeLeader();
    // And also on visibility regain (e.g., if leader tab was closed)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.tryBecomeLeader();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === LEADER_KEY) {
        const { isLeader } = this.readLeader();
        if (!isLeader && this.isLeader) this.demote();
        if (isLeader && !this.isLeader) this.follow();
      }
    });
  }

  on(event: string, fn: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(fn);
    // ensure there is a connection somewhere
    this.ensureConnected();
    return () => this.off(event, fn);
  }

  off(event: string, fn: Handler) {
    this.handlers.get(event)?.delete(fn);
  }

  emit(event: string, payload: any) {
    this.handlers.get(event)?.forEach(h => {
      try { h(payload); } catch { }
    });
  }

  // Public: make sure *some* tab has an active WS
  ensureConnected() {
    const token = AuthStorage.getAuthData()?.sessionToken;
    if (!token) return; // not logged in yet
    const { isLeader } = this.readLeader();
    if (isLeader) {
      if (!this.ws || this.ws.readyState > 1) this.connect();
    } else {
      // follower relies on leader; if no leader, try seize
      this.tryBecomeLeader();
    }
  }

  // ----- Leader election helpers -----
  private readLeader() {
    const raw = localStorage.getItem(LEADER_KEY);
    if (!raw) return { isLeader: false, id: null, expired: true };
    try {
      const obj = JSON.parse(raw);
      const expired = Date.now() > obj.expiresAt;
      const isLeader = !expired && obj.id === this.leaderId;
      return { isLeader, id: obj.id, expired };
    } catch {
      return { isLeader: false, id: null, expired: true };
    }
  }

  private writeLeader() {
    localStorage.setItem(LEADER_KEY, JSON.stringify({
      id: this.leaderId,
      expiresAt: Date.now() + LOCK_TTL_MS
    }));
  }

  private clearLeader() {
    const raw = localStorage.getItem(LEADER_KEY);
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        if (obj.id === this.leaderId) localStorage.removeItem(LEADER_KEY);
      } catch { }
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.hbTimer = window.setInterval(() => {
      // refresh lock + broadcast ping so followers know leader is alive
      this.writeLeader();
      this.bc.postMessage({ type: '__leader_ping__', t: Date.now() });
    }, HEARTBEAT_MS) as unknown as number;
  }

  private stopHeartbeat() {
    if (this.hbTimer) { clearInterval(this.hbTimer); this.hbTimer = null; }
  }

  private tryBecomeLeader() {
    const now = Date.now();
    const raw = localStorage.getItem(LEADER_KEY);
    let canClaim = false;
    if (!raw) canClaim = true;
    else {
      try {
        const obj = JSON.parse(raw);
        if (now > obj.expiresAt) canClaim = true; // expired lock
      } catch {
        canClaim = true;
      }
    }
    if (canClaim) {
      this.isLeader = true;
      this.writeLeader();
      this.startHeartbeat();
      this.connect();
    } else {
      this.follow();
    }
  }

  private follow() {
    this.isLeader = false;
    this.stopHeartbeat();
    this.cleanupWS(); // make sure follower doesn't hold a socket
  }

  private demote() {
    this.isLeader = false;
    this.stopHeartbeat();
    this.cleanupWS();
  }

  // ----- WebSocket lifecycle (leader only) -----
  private connect() {
    if (!this.isLeader) return;
    const token = AuthStorage.getAuthData()?.sessionToken;
    if (!token) return;

    try {
      this.cleanupWS();
      const ws = new WebSocket(WS_BASE, token);

      this.ws = ws;

      ws.onopen = () => {
        this.backoff = RECONNECT_MIN;
        // nothing to send; server will push messages
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          // fanout to followers + this tab subscribers
          if (msg && msg.type) {
            this.bc.postMessage(msg);
            this.emit(msg.type, msg.payload);
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => this.scheduleReconnect();
      ws.onerror = () => {
        try { ws.close(); } catch { }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.isLeader) return;
    if (this.reconnectTimer) return;
    const delay = this.backoff + Math.floor(Math.random() * 400);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.backoff = Math.min(this.backoff * 2, RECONNECT_MAX);
      this.connect();
    }, delay) as unknown as number;
  }

  private cleanupWS() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.ws) {
      try { this.ws.onopen = this.ws.onclose = this.ws.onmessage = this.ws.onerror = null!; this.ws.close(); } catch { }
      this.ws = null;
    }
  }

  // Call on logout
  reset() {
    this.clearLeader();
    this.demote();
  }
}

export const WSClient = new WSBus();
