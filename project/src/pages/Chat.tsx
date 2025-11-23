import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Menu, LogOut, MessageCircle, X, Settings, Users,
  Wallet as WalletIcon, Compass,Zap
} from 'lucide-react';

import { AuthService, ApiClient, AuthStorage } from '../lib/authService';
import { WSClient } from '../lib/wsClient';
import Lounge from '../components/Lounge';
import Wallet from '../components/Wallet';
import Explorer from './Explorer';
import APIDoc from './ApiDoc'; // adjust the path if needed

import nacl from 'tweetnacl';
import ed2curve from 'ed2curve';
import bs58 from 'bs58';
import { ZKAuthService } from '../lib/zkAuth';
import { Toaster, toast } from 'sonner';
// ----------------- utils & guards -----------------
const is32 = (u: Uint8Array | null | undefined) => !!u && u.length === 32;
const is24 = (u: Uint8Array | null | undefined) => !!u && u.length === 24;

// ---------- in-memory store for per-conversation symmetric keys ----------
const convKeyMem = new Map<string, Uint8Array>();

function cacheConvKey(convId: string, key: Uint8Array) {
  if (!is32(key)) return;
  convKeyMem.set(convId, key);
}

function getCachedConvKey(convId: string): Uint8Array | null {
  return convKeyMem.get(convId) || null;
}

function dropConvKey(convId: string) {
  convKeyMem.delete(convId);
}
// ------------- toast helpers -------------
const toastApiError = (msg?: string) =>
  toast.error(msg || 'Something went wrong', { duration: 3500 });

const toastWarn = (msg: string) =>
  toast.warning(msg, { duration: 3000 });

const toastOk = (msg: string) =>
  toast.success(msg, { duration: 2500 });

// ---------- types ----------
type EncryptedMsg = {
  id: string;
  conversation_id: string;
  sender_id: string;
  created_at: string;
  ciphertext_b58: string;
  nonce_b58: string;
  sig_b58?: string;
  sender?: { username: string; profile_picture_url?: string };
};

type ViewMsg = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { username: string; profile_picture_url?: string };
};

type Conversation = {
  id: string;
  name: string | null;
  is_group: boolean;
  updated_at: string;
  last_message?: EncryptedMsg;
  other_user?: { username: string; is_online: boolean; profile_picture_url?: string };
};

type Profile = { id: string; username: string; is_online: boolean; profile_picture_url?: string };

export default function Chat() {
  const navigate = useNavigate();

  // auth + profile
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<{ id: string; username: string; profile_picture_url?: string; is_online: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ViewMsg[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSearch, setShowSearch] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsUsername, setSettingsUsername] = useState('');
  const [settingsProfilePicture, setSettingsProfilePicture] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [updatedConversationId, setUpdatedConversationId] = useState<string | null>(null);
  const [activeNavTab, setActiveNavTab] = useState<'chat' | 'lounge' | 'wallet' | 'explorer' | 'x402'>('chat');

  const [pendingDmUserId, setPendingDmUserId] = useState<string | null>(null);
  const [pendingDmUserProfile, setPendingDmUserProfile] = useState<Profile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // my ed25519 pair (from expanded 64-byte secret in storage)
  const edPairRef = useRef<nacl.SignKeyPair | null>(null);
  function getEdPair(): nacl.SignKeyPair {
    if (edPairRef.current) return edPairRef.current;
    const zk = AuthStorage.getSecretKey();
    if (!zk) throw new Error('Missing ZK secret key in storage');
    const sk = ZKAuthService.parseSecretKey(zk); // Uint8Array(64)
    const pair = nacl.sign.keyPair.fromSecretKey(sk);
    edPairRef.current = pair;
    return pair;
  }

  // --------- convo key fetching/unsealing (mirror Lounge) ----------
  async function ensureConvKey(conversationId: string): Promise<Uint8Array> {
    const cached = getCachedConvKey(conversationId);
    if (cached) {
      return cached;
    }

    console.debug('[DM conv-key] fetch envelope', { conversationId });
    const resp = await ApiClient.get(`/chat/conv-key?conversationId=${encodeURIComponent(conversationId)}`);
    if (!resp?.ok) {
      console.error('[DM conv-key] server error', resp?.error);
      throw new Error(resp?.error || 'failed to fetch conversation key');
    }

    const { ephPub, nonce, sealed } = resp as { ephPub: string; nonce: string; sealed: string; };

    let theirPubCurve: Uint8Array, n: Uint8Array, sealedBytes: Uint8Array;
    try {
      theirPubCurve = bs58.decode(ephPub);
      n = bs58.decode(nonce);
      sealedBytes = bs58.decode(sealed);
    } catch (e) {
      console.error('[DM conv-key] b58 decode failed', e);
      throw new Error('failed to decode conv key envelope');
    }

    console.debug('[DM conv-key] envelope sizes', {
      ephPubLen: theirPubCurve.length,
      nonceLen: n.length,
      sealedLen: sealedBytes.length
    });

    if (!is32(theirPubCurve)) throw new Error('bad eph pub size');
    if (!is24(n)) throw new Error('bad nonce size');
    if (!sealedBytes || sealedBytes.length < nacl.box.overheadLength) {
      throw new Error('bad sealed payload');
    }

    // Derive curve secret EXACTLY like Lounge
    const zkSecret = AuthStorage.getSecretKey();
    if (!zkSecret) throw new Error('no zk secret in storage');
    const edSecret64 = ZKAuthService.parseSecretKey(zkSecret); // 64B expanded
    const edPair = nacl.sign.keyPair.fromSecretKey(edSecret64);
    const curveSecret = ed2curve.convertSecretKey(edPair.secretKey);

    if (!is32(curveSecret)) {
      console.error('[DM conv-key] ed2curve conversion failed');
      throw new Error('failed to derive curve secret');
    }

    const roomKey = nacl.box.open(sealedBytes, n, theirPubCurve, curveSecret as Uint8Array);
    if (!roomKey || !is32(roomKey)) {
      console.error('[DM conv-key] nacl.box.open failed');
      throw new Error('failed to unseal conversation key');
    }

    cacheConvKey(conversationId, roomKey);
    console.debug('[DM conv-key] unsealed OK', { conversationId, keyLen: roomKey.length });
    return roomKey;
  }

  // --------- encrypt/decrypt helpers ----------
  async function encryptForConversationById(convId: string, plaintext: string): Promise<{
    nonce_b58: string; ciphertext_b58: string; nonceBytes: Uint8Array; cipherBytes: Uint8Array;
  }> {
    let key = getCachedConvKey(convId);
    if (!is32(key)) {
      // fetch fresh (in-memory cache only)
      key = await ensureConvKey(convId);
    }
    if (!is32(key)) throw new Error('invalid conversation key');

    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const msg = new TextEncoder().encode(plaintext);
    const ct = nacl.secretbox(msg, nonce, key as Uint8Array);
    return {
      nonce_b58: bs58.encode(nonce),
      ciphertext_b58: bs58.encode(ct),
      nonceBytes: nonce,
      cipherBytes: ct
    };
  }

  function decryptForConversationById(convId: string, nonce_b58: string, ciphertext_b58: string): string | null {
    const key = getCachedConvKey(convId);
    if (!is32(key)) return null;
    let nonce: Uint8Array, ct: Uint8Array;
    try {
      nonce = bs58.decode(nonce_b58);
      ct = bs58.decode(ciphertext_b58);
    } catch (e) {
      console.warn('[DM decrypt] base58 decode error', e);
      return null;
    }
    if (!is24(nonce)) return null;
    const opened = nacl.secretbox.open(ct, nonce, key as Uint8Array);
    if (!opened) {
      console.warn('[DM decrypt] secretbox.open failed');
      return null;
    }
    return new TextDecoder().decode(opened);
  }

  function signNonceCipher(nonce: Uint8Array, ct: Uint8Array): Uint8Array {
    const ed = getEdPair();
    const data = new Uint8Array(nonce.length + ct.length);
    data.set(nonce, 0); data.set(ct, nonce.length);
    return nacl.sign.detached(data, ed.secretKey);
  }

  // ------- boot / auth -------
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    (async () => {
      if (!AuthService.isAuthenticated()) { navigate('/dapp/auth'); return; }
      const cur = await AuthService.getCurrentUser();
      if (!cur || !cur.success) { navigate('/dapp/auth'); return; }

      setUser({ id: cur.userId! });
      setProfile({ id: cur.userId!, username: cur.username!, profile_picture_url: '', is_online: true });

      // Load conversations
      await loadConversations();

      // WS: messages
      const offMsg = WSClient.on('message:new', async (m: EncryptedMsg) => {
        try {
          // Ensure key best-effort
          await ensureConvKey(m.conversation_id).catch((e) => {
            console.warn('[WS message:new] ensureConvKey failed (will retry on open)', e);
          });
          const text = decryptForConversationById(m.conversation_id, m.nonce_b58, m.ciphertext_b58);
          if (!text) return;

          if (m.conversation_id === selectedConversation) {
            setMessages(prev => {
              if (prev.some(x => x.id === m.id)) return prev;
              const next = [...prev, {
                id: m.id,
                conversation_id: m.conversation_id,
                sender_id: m.sender_id,
                content: text,
                created_at: m.created_at,
                sender: m.sender
              }];
              next.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
              return next;
            });
          }

          bumpConversationPreview(m, text);
        } catch (e) {
          console.warn('[WS message:new] unable to decrypt yet', e);
        }
      });

      // WS: new conversation
      const offConv = WSClient.on('conversation:new', async () => {
        await loadConversations();
      });

      WSClient.ensureConnected();
      setLoading(false);

      return () => { offMsg(); offConv(); };
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  // Load conversations; previews decrypt lazily via cached keys only
  async function loadConversations() {
    const res = await ApiClient.get('/chat/conversations');
    if (!res?.ok) return;
    const list: Conversation[] = res.conversations || [];
    list.sort((a, b) =>
      new Date(b.last_message?.created_at || b.updated_at).getTime() -
      new Date(a.last_message?.created_at || a.updated_at).getTime()
    );
    setConversations(list);
  }

  // preview helper (safe)
  function decryptedPreview(conv: Conversation): string {
    try {
      if (!conv.last_message) return 'No messages yet';
      const t = decryptForConversationById(conv.id, conv.last_message.nonce_b58, conv.last_message.ciphertext_b58);
      return t || 'Encrypted message';
    } catch (e) {
      console.warn('[DM preview] decrypt failed', e);
      return 'Encrypted message';
    }
  }

  // keep ordering & previews fresh
  function bumpConversationPreview(m: EncryptedMsg, _plaintext: string) {
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === m.conversation_id);
      if (idx === -1) return prev;
      const c = prev[idx];
      const updated: Conversation = { ...c, last_message: { ...m }, updated_at: m.created_at };
      const arr = prev.slice();
      arr.splice(idx, 1);
      arr.unshift(updated);
      return arr;
    });
    if (m.conversation_id !== selectedConversation) {
      setUpdatedConversationId(m.conversation_id);
      setTimeout(() => setUpdatedConversationId(null), 1000);
    }
  }

  // when selecting a conversation, fetch (encrypted) messages and decrypt
  useEffect(() => {
    if (!selectedConversation) return;
    (async () => {
      try {
        // Always drop stale in-memory key before reopening to mimic Lounge’s fresh behavior
        dropConvKey(selectedConversation);
        await ensureConvKey(selectedConversation);

        const res = await ApiClient.get(`/chat/messages?conversationId=${selectedConversation}`);
        if (!res?.ok) return;
        const enc: EncryptedMsg[] = res.messages || [];
        const out: ViewMsg[] = [];
        for (const m of enc) {
          const text = decryptForConversationById(selectedConversation, m.nonce_b58, m.ciphertext_b58);
          if (!text) continue;
          out.push({
            id: m.id,
            conversation_id: m.conversation_id,
            sender_id: m.sender_id,
            content: text,
            created_at: m.created_at,
            sender: m.sender
          });
        }
        out.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
        setMessages(out);
        setIsUserAtBottom(true);
        setTimeout(() => scrollToBottom(), 30);
      } catch (e) {
        console.error('load messages failed', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  // search users
  useEffect(() => { searchQuery.trim() ? searchUsers() : setSearchResults([]); }, [searchQuery]);
  async function searchUsers() {
    const res = await ApiClient.get(`/profiles/search?q=${encodeURIComponent(searchQuery)}`);
    if (res?.ok) setSearchResults(res.results);
  }

  async function startConversation(otherUserId: string) {
    const res = await ApiClient.post('/chat/conversations', { otherUserId });
    if (res?.ok) {
      const convId = res.conversation._id || res.conversation.id;
      setSelectedConversation(convId);
      setPendingDmUserId(null);
      setPendingDmUserProfile(null);
      // try prefetching key (best-effort)
      try { await ensureConvKey(convId); } catch (e) { console.debug('[startConversation] ensureConvKey failed (will retry on open)', e); }
      await loadConversations();
    }
  }

  // send (E2E encrypted) — rely on WS for delivery (no optimistic append to avoid duplicates)
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    let conversationId = selectedConversation;

    if (pendingDmUserId && !selectedConversation) {
      const res = await ApiClient.post('/chat/conversations', { otherUserId: pendingDmUserId });
      if (!res?.ok) return;
      conversationId = res.conversation._id || res.conversation.id;
      setSelectedConversation(conversationId);
      setPendingDmUserId(null);
      setPendingDmUserProfile(null);
      await loadConversations();
    }

    if (!conversationId) return;

    try {
      const { nonce_b58, ciphertext_b58, nonceBytes, cipherBytes } =
        await encryptForConversationById(conversationId, text);

      const sigBytes = signNonceCipher(nonceBytes, cipherBytes);
      const sig_b58 = bs58.encode(sigBytes);

      setNewMessage('');
      const r = await ApiClient.post('/chat/messages', {
        conversationId,
        ciphertext_b58,
        nonce_b58,
        sig_b58
      });

      if (!r?.ok) {
        setNewMessage(text); // restore
        toastApiError(r?.error || 'Failed to send message');
        return;
      }

      // WS will add exactly one copy
      setTimeout(() => scrollToBottom(), 20);
    } catch (err) {
      console.error('sendMessage failed', err);
      toastApiError('Failed to send message');
    }
  }

  // misc UI utils
  function scrollToBottom() { messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }); }
  function checkIfUserAtBottom() {
    if (!messagesContainerRef.current) return;
    const c = messagesContainerRef.current;
    setIsUserAtBottom(c.scrollHeight - c.scrollTop - c.clientHeight < 100);
  }
  const formatTime = (ts: string) => {
    const d = new Date(ts), now = new Date();
    const diffH = (now.getTime() - d.getTime()) / 36e5;
    return diffH < 24
      ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const currentConv = useMemo(
    () => conversations.find(c => c.id === selectedConversation),
    [conversations, selectedConversation]
  );
  const chatName = currentConv?.other_user?.username || 'Chat';
  const isOnline = currentConv?.other_user?.is_online || false;

  // settings + uploads
  async function handleOpenSettings() {
    setSettingsUsername(profile?.username || '');
    setSettingsProfilePicture(profile?.profile_picture_url || '');
    setPreviewUrl(profile?.profile_picture_url || '');
    setSelectedFile(null); setSettingsError(''); setSettingsSuccess('');
    setShowSettings(true); setShowMenu(false);
  }
  const handleSignOut = async () => { await AuthService.signOut(); navigate('/'); };
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(f.type);
    if (!ok) { setSettingsError('Please select a valid image file'); return; }
    if (f.size > 5 * 1024 * 1024) { setSettingsError('Image size must be less than 5MB'); return; }
    setSelectedFile(f); setSettingsError('');
    const rd = new FileReader(); rd.onloadend = () => setPreviewUrl(rd.result as string); rd.readAsDataURL(f);
  }
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsError(''); setSettingsSuccess('');
    if (settingsUsername.length < 3) return setSettingsError('Username must be at least 3 characters');
    if (settingsUsername.length > 20) return setSettingsError('Username must be less than 20 characters');
    if (!/^[a-zA-Z0-9_]+$/.test(settingsUsername)) return setSettingsError('Username can only contain letters, numbers, and underscores');
    setSettingsSaving(true);
    try {
      let url = settingsProfilePicture;
      if (selectedFile && user?.id) {
        const form = new FormData();
        form.append('file', selectedFile);
        const r = await fetch(`${ApiClient.base}/upload/profile-picture`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${ApiClient.token()}` as string },
          body: form
        });
        const jr = await r.json();
        if (!jr?.ok) throw new Error('Upload failed');
        url = jr.url;
      }
      const res = await ApiClient.patch('/profiles', { username: settingsUsername, profile_picture_url: url || null });
      if (!res?.ok) throw new Error(res?.error || 'Failed to update profile');
      setProfile({ ...profile!, username: settingsUsername, profile_picture_url: url || null });
      setSettingsSuccess('Profile updated successfully!');
      setTimeout(() => { setShowSettings(false); setSelectedFile(null); }, 1200);
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to update profile');
    } finally {
      setSettingsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#17ff9a] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex overflow-hidden">
      {/* LEFT: conversations */}
      <div className={`${isMobile && (selectedConversation || activeNavTab !== 'chat') ? 'hidden' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-[#1a1a1a] bg-[#0f0f0f]`}>
        <div className="flex-shrink-0 bg-gradient-to-r from-[#111] to-[#0a0a0a] border-b border-[#1a1a1a] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center shadow-lg shadow-[#17ff9a]/20">
                <span className="text-black font-bold text-lg">Z</span>
              </div>
              <h1 className="text-xl font-bold text-white">Messages</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 ${showMenu ? 'bg-gradient-to-br from-[#17ff9a] to-[#10b981] text-black shadow-lg shadow-[#17ff9a]/20'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-[#17ff9a] hover:bg-[#1f1f1f]'
                  }`}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showSearch && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all"
                  autoFocus
                />
              </div>

              {searchResults.length > 0 && (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => startConversation(result.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[#252525] transition-all group"
                    >
                      <div className="relative">
                        {result.profile_picture_url ? (
                          <img
                            src={result.profile_picture_url}
                            alt={result.username}
                            className="w-11 h-11 rounded-full object-cover border-2 border-[#2a2a2a]"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center shadow-lg shadow-[#17ff9a]/10 group-hover:shadow-[#17ff9a]/30 transition-all">
                            <span className="text-black font-bold">
                              {result.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {result.is_online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#17ff9a] border-2 border-[#1a1a1a] rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium text-sm">{result.username}</p>
                        <p className="text-xs text-gray-500">{result.is_online ? 'Online' : 'Offline'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {showMenu && (
            <div className="mt-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {profile?.profile_picture_url ? (
                      <img
                        src={profile.profile_picture_url}
                        alt={profile.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#2a2a2a]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center shadow-lg shadow-[#17ff9a]/20">
                        <span className="text-black font-bold text-lg">
                          {profile?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#17ff9a] border-2 border-[#1a1a1a] rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{profile?.username}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#17ff9a] rounded-full" />
                      Online
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleOpenSettings}
                className="w-full flex items-center gap-3 p-4 text-gray-300 hover:bg-[#252525] hover:text-[#17ff9a] transition-all group border-b border-[#2a2a2a]"
              >
                <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Profile Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 p-4 text-red-400 hover:bg-[#252525] transition-all group"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#17ff9a]/10 to-[#10b981]/10 border border-[#17ff9a]/20 flex items-center justify-center mb-4 shadow-lg shadow-[#17ff9a]/5">
                <MessageCircle className="w-10 h-10 text-[#17ff9a]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Conversations</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">
                Search for users to start chatting securely with end-to-end encryption
              </p>
              <button
                onClick={() => setShowSearch(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#17ff9a] to-[#10b981] text-black font-semibold rounded-xl hover:shadow-xl hover:shadow-[#17ff9a]/20 transition-all active:scale-95"
              >
                Start Chatting
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {conversations.map((conv, index) => (
                <button
                  key={`${conv.id}-${conv.last_message?.id || 'no-msg'}`}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`
                    w-full flex items-center gap-3 p-4 transition-all duration-200 ease-in-out group
                    ${selectedConversation === conv.id
                      ? 'bg-[#1a1a1a] border-l-4 border-[#17ff9a]'
                      : updatedConversationId === conv.id
                        ? 'bg-[#17ff9a]/5 border-l-4 border-[#17ff9a]/50'
                        : 'hover:bg-[#151515] border-l-4 border-transparent'
                    }
                  `}
                  style={{ animation: `fadeInSlide 0.3s ease-out ${index * 0.05}s both` }}
                >
                  <div className="relative flex-shrink-0">
                    {conv.other_user?.profile_picture_url ? (
                      <img
                        src={conv.other_user.profile_picture_url}
                        alt={conv.other_user.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#2a2a2a]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center shadow-lg shadow-[#17ff9a]/10 group-hover:shadow-[#17ff9a]/30 transition-all duration-300">
                        <span className="text-black font-bold">
                          {(conv.other_user?.username || 'C').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {conv.other_user?.is_online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#17ff9a] border-2 border-[#0f0f0f] rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-semibold text-sm truncate">
                        {conv.other_user?.username || 'Chat'}
                      </p>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0 transition-all duration-300">
                        {formatTime(conv.last_message?.created_at || conv.updated_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate transition-all duration-300">
                      {decryptedPreview(conv)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: messages / lounge / wallet / explorer */}
      <div className={`${isMobile && !selectedConversation && activeNavTab === 'chat' ? 'hidden' : 'flex'} flex-col flex-1 bg-[#0a0a0a] pb-28`}>
        {selectedConversation ? (
          <>
            <div className="flex-shrink-0 bg-gradient-to-r from-[#111] to-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-3 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1f1f1f] transition-all active:scale-95"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div className="relative">
                  {(currentConv?.other_user?.profile_picture_url) ? (
                    <img
                      src={currentConv?.other_user?.profile_picture_url}
                      alt={currentConv?.other_user?.username || 'Chat'}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#2a2a2a]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center shadow-lg shadow-[#17ff9a]/20">
                      <span className="text-black font-bold text-sm">
                        {(currentConv?.other_user?.username || 'C').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#17ff9a] border-2 border-[#111] rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold truncate">{currentConv?.other_user?.username || 'Chat'}</h2>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    {isOnline && <span className="w-1.5 h-1.5 bg-[#17ff9a] rounded-full" />}
                    {isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={messagesContainerRef}
              onScroll={checkIfUserAtBottom}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
            >
              {messages.map((message, index) => {
                const isOwnMessage = message.sender_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]`}
                  >
                    {!isOwnMessage && (
                      <div className="flex-shrink-0">
                        {showAvatar ? (
                          message.sender?.profile_picture_url ? (
                            <img
                              src={message.sender.profile_picture_url}
                              alt={message.sender.username}
                              className="w-8 h-8 rounded-full object-cover border border-[#2a2a2a]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center shadow-md">
                              <span className="text-black font-bold text-xs">
                                {(message.sender?.username || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="w-8 h-8" />
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                      {showAvatar && !isOwnMessage && (
                        <span className="text-xs text-gray-500 font-medium mb-1 ml-1">
                          {message.sender?.username}
                        </span>
                      )}
                      <div
                        className={`
                          rounded-2xl px-4 py-2.5 shadow-lg
                          ${isOwnMessage
                            ? 'bg-gradient-to-br from-[#17ff9a] to-[#10b981] text-black shadow-[#17ff9a]/20 rounded-br-md'
                            : 'bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-bl-md'
                          }
                        `}
                      >
                        <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-1.5 ${isOwnMessage ? 'text-black/60' : 'text-gray-500'}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>

                    {isOwnMessage && <div className="w-8 flex-shrink-0" />}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 bg-gradient-to-r from-[#111] to-[#0a0a0a] border-t border-[#1a1a1a] p-4 backdrop-blur-xl">
              <form onSubmit={sendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 bg-gradient-to-r from-[#17ff9a] to-[#10b981] rounded-xl flex items-center justify-center hover:shadow-xl hover:shadow-[#17ff9a]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none active:scale-95"
                >
                  <Send className="w-5 h-5 text-black" />
                </button>
              </form>
            </div>
          </>
        ) : activeNavTab === 'lounge' ? (
          isMobile ? (
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 bg-gradient-to-r from-[#111] to-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-3 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center shadow-lg shadow-[#17ff9a]/20">
                    <Users className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">Global Lounge</h2>
                    <p className="text-xs text-gray-500">Public chat room</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <Lounge userId={user!.id} profile={profile} onUserClick={startConversation} />
              </div>
            </div>
          ) : (
            <Lounge userId={user!.id} profile={profile} onUserClick={startConversation} />
          )
        ) : activeNavTab === 'wallet' ? (
          isMobile ? (
            <div className="flex flex-col h-full">
              <div className="flex-shrink-0 bg-gradient-to-r from-[#111] to-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-3 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center shadow-lg shadow-[#17ff9a]/20">
                    <WalletIcon className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white">My Wallet</h2>
                    <p className="text-xs text-gray-500">Solana USDC</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <Wallet userId={user!.id} profile={profile} />
              </div>
            </div>
          ) : (
            <Wallet userId={user!.id} profile={profile} />
          )
        ) : activeNavTab === 'explorer' ? (
          <Explorer />
        ) : activeNavTab === 'x402' ? (
          <APIDoc
            userId={user?.id}
            username={profile?.username || 'User'}
            profilePictureUrl={profile?.profile_picture_url}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#17ff9a]/10 to-[#10b981]/10 border border-[#17ff9a]/20 flex items-center justify-center mb-6 shadow-xl shadow-[#17ff9a]/10">
              <MessageCircle className="w-12 h-12 text-[#17ff9a]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Select a conversation</h3>
            <p className="text-sm text-gray-400 max-w-md">Choose a conversation from the sidebar to start chatting securely</p>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
        <div className="relative mx-4 mb-4">
          <div className="absolute inset-0 bg-gradient-to-t from-[#17ff9a]/20 via-[#10b981]/10 to-transparent blur-2xl" />
          <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] rounded-3xl border border-[#2a2a2a] shadow-[0_8px_32px_rgba(0,0,0,0.6),0_-2px_16px_rgba(23,255,154,0.1)] backdrop-blur-xl overflow-hidden">
            <div className="relative flex items-center justify-around px-2 py-4">
              {(['chat', 'lounge', 'wallet', 'explorer', 'x402'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveNavTab(tab);
                    if (tab !== 'chat') setSelectedConversation(null);
                  }}
                  className={`relative flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl transition-all duration-300 group ${activeNavTab === tab ? 'text-black scale-105' : 'text-gray-400 hover:text-white hover:scale-105'
                    }`}
                >
                  {activeNavTab === tab && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#17ff9a] to-[#10b981] rounded-2xl shadow-[0_4px_16px_rgba(23,255,154,0.4),0_0_0_1px_rgba(23,255,154,0.2)]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/10 rounded-2xl" />
                    </>
                  )}
                  {tab === 'chat' && <MessageCircle className={`relative w-5 h-5 ${activeNavTab === tab ? 'scale-110' : 'group-hover:scale-110'}`} />}
                  {tab === 'lounge' && <Users className={`relative w-5 h-5 ${activeNavTab === tab ? 'scale-110' : 'group-hover:scale-110'}`} />}
                  {tab === 'wallet' && <WalletIcon className={`relative w-5 h-5 ${activeNavTab === tab ? 'scale-110' : 'group-hover:scale-110'}`} />}
                  {tab === 'explorer' && <Compass className={`relative w-5 h-5 ${activeNavTab === tab ? 'scale-110' : 'group-hover:scale-110'}`} />}
                  {tab === 'x402' && <Zap className={`relative w-5 h-5 ${activeNavTab === tab ? 'scale-110' : 'group-hover:scale-110'}`} />}

                  <span className="relative text-[10px] font-semibold tracking-wide capitalize">{tab}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] rounded-3xl shadow-2xl">
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
                <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-[#2a2a2a]" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center">
                        <span className="text-black text-2xl font-bold">
                          {settingsUsername.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {(previewUrl || selectedFile) && (
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(''); setSettingsProfilePicture(''); }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Profile Picture</label>
                  <div className="relative">
                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="hidden" id="profile-picture-upload" />
                    <label htmlFor="profile-picture-upload" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 text-sm hover:border-[#17ff9a] hover:text-[#17ff9a] cursor-pointer transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      {selectedFile ? selectedFile.name : 'Choose an image'}
                    </label>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">JPG, PNG, GIF, or WebP. Max 5MB.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                  <input
                    type="text"
                    value={settingsUsername}
                    onChange={(e) => setSettingsUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all"
                    required
                  />
                  <p className="mt-1.5 text-xs text-gray-500">3-20 characters, letters, numbers, and underscores only</p>
                </div>

                {settingsError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm">{settingsError}</p>
                  </div>
                )}
                {settingsSuccess && (
                  <div className="p-3 bg-[#17ff9a]/10 border border-[#17ff9a]/20 rounded-xl">
                    <p className="text-[#17ff9a] text-sm">{settingsSuccess}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowSettings(false)} className="flex-1 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 font-medium rounded-xl hover:bg-[#252525] transition-all">Cancel</button>
                  <button type="submit" disabled={settingsSaving} className="flex-1 py-2.5 bg-gradient-to-r from-[#17ff9a] to-[#10b981] text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-[#17ff9a]/20 transition-all disabled:opacity-50">
                    {settingsSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
