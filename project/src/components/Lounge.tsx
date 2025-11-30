// components/Lounge.tsx
import { useState, useEffect, useRef } from 'react';
import { Send, Users } from 'lucide-react';
import { ApiClient, AuthStorage } from '../lib/authService';
import { WSClient } from '../lib/wsClient';
import { ZKAuthService } from '../lib/zkAuth';
import nacl from 'tweetnacl';
import ed2curve from 'ed2curve';
import bs58 from 'bs58';
import { toast } from 'sonner';

interface LoungeMessageEncrypted {
  id: string;
  sender_id: string;
  created_at: string;
  ciphertext_b58: string;
  nonce_b58: string;
  sig_b58?: string;
  key_version?: number;
  sender?: { username: string; profile_picture_url?: string };
}
interface LoungeMessageView {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: { username: string; profile_picture_url?: string };
}

interface LoungeProps {
  userId: string;
  profile: any;
  onUserClick?: (userId: string) => void;
}

// -------- toast helpers ----------
const toastApiError = (msg?: string) =>
  toast.error(msg || 'Something went wrong', { duration: 3500 });
const toastWarn = (msg: string) =>
  toast.warning(msg, { duration: 3000 });
const toastOk = (msg: string) =>
  toast.success(msg, { duration: 2500 });

export default function Lounge({ userId, profile, onUserClick }: LoungeProps) {
  const [messages, setMessages] = useState<LoungeMessageView[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // cooldown (temp 10s; was 3 min)
  const COOLDOWN_MS = 10_000;
  const lastMessageTimeRef = useRef<number>(0);
  const STORAGE_KEY = `lounge_last_message_${userId}`;

  // --- Room key kept only in memory ---
  const roomKeysRef = useRef<Map<number, Uint8Array>>(new Map());
  const [latestKeyVersion, setLatestKeyVersion] = useState<number>(1);
  const [hasKeys, setHasKeys] = useState(false);
  const edPairRef = useRef<nacl.SignKeyPair | null>(null);

  // --------- helpers: keying & crypto ----------
  // --------- helpers: keying & crypto ----------
  async function loadEdPair() {
    if (edPairRef.current) return;
    const pwd = sessionStorage.getItem('encryption_password');
    if (!pwd) return; // Silent fail, will be caught by ensureRoomKey check
    const zk = await AuthStorage.getSecretKey(pwd);
    if (!zk) return;
    const sk = ZKAuthService.parseSecretKey(zk); // Uint8Array(64) expanded
    const pair = nacl.sign.keyPair.fromSecretKey(sk);
    edPairRef.current = pair;
  }

  function getEdPair(): nacl.SignKeyPair {
    if (edPairRef.current) return edPairRef.current;
    throw new Error('Keys not loaded');
  }

  async function ensureRoomKey() {
    // if (roomKeyRef.current) return; // Removed as we now manage multiple keys in a map
    const r = await ApiClient.get('/lounge/key');
    // Backward compatibility: check both 'success' (new) and 'ok' (old) fields
    const isSuccess = r?.success || r?.ok;
    if (!isSuccess) throw new Error(r?.error || 'failed to fetch lounge key');

    const edPair = getEdPair();
    const curveSk = ed2curve.convertSecretKey(edPair.secretKey);
    if (!curveSk) throw new Error('failed to derive curve sk');

    const ephPub = bs58.decode(r.ephPub);
    const nonce = bs58.decode(r.nonce);

    // New format: r.keys is array of { version, sealed }
    // Fallback: r.sealed (old format, version=1 or 2 implicit)
    const keysToProcess = r.keys || [{ version: r.version || 1, sealed: r.sealed }];

    const map = new Map<number, Uint8Array>();
    let maxVer = 0;

    for (const k of keysToProcess) {
      const sealed = bs58.decode(k.sealed);
      const opened = nacl.box.open(sealed, nonce, ephPub, curveSk);
      if (opened) {
        map.set(k.version, opened);
        if (k.version > maxVer) maxVer = k.version;
      }
    }

    if (map.size === 0) throw new Error('failed to decrypt any lounge keys');

    roomKeysRef.current = map;
    setLatestKeyVersion(maxVer);
    setHasKeys(true);
    console.log(`[Lounge] Loaded ${map.size} keys, latest=${maxVer}`);
  }

  function decryptMessage(m: LoungeMessageEncrypted): string | null {
    const version = m.key_version || 1;
    const key = roomKeysRef.current.get(version);

    if (!key) {
      console.warn(`[Lounge] No key found for version ${version}`);
      return null;
    }

    const ct = bs58.decode(m.ciphertext_b58);
    const nonce = bs58.decode(m.nonce_b58);
    const opened = nacl.secretbox.open(ct, nonce, key);
    if (!opened) {
      console.warn(`[Lounge] Failed to decrypt message ${m.id} with key version ${version}`);
      return null;
    }
    return new TextDecoder().decode(opened);
  }

  function encryptMessage(plain: string) {
    if (!hasKeys) throw new Error('room keys not ready');
    const key = roomKeysRef.current.get(latestKeyVersion);
    if (!key) throw new Error('no room key for latest version');

    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const msg = new TextEncoder().encode(plain);
    const ct = nacl.secretbox(msg, nonce, key);
    return { nonce, ct };
  }

  function signNonceCipher(nonce: Uint8Array, ct: Uint8Array) {
    const ed = getEdPair();
    const data = new Uint8Array(nonce.length + ct.length);
    data.set(nonce, 0); data.set(ct, nonce.length);
    return nacl.sign.detached(data, ed.secretKey);
  }

  // --------- bootstrap ----------
  useEffect(() => {
    (async () => {
      try {
        await loadEdPair();
        await ensureRoomKey();
        // loadMessages now happens after ensureRoomKey completes

        const off = WSClient.on('lounge:new', (m: LoungeMessageEncrypted) => {
          const text = decryptMessage(m);
          if (!text) return;
          setMessages(prev => {
            if (prev.some(x => x.id === m.id)) return prev;
            const view: LoungeMessageView = {
              id: m.id,
              content: text,
              sender_id: m.sender_id,
              created_at: m.created_at,
              sender: m.sender
            };
            const next = [...prev, view];
            next.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
            return next;
          });
        });

        WSClient.ensureConnected();

        const stopTicker = startCooldownTicker();
        initCooldownFromStorage();

        return () => { off(); stopTicker(); };
      } catch (e: any) {
        if (import.meta.env.DEV) console.error('[Lounge] bootstrap failed', e);
        toastApiError(e?.message || 'Failed to initialize Lounge');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages when keys become available
  useEffect(() => {
    if (hasKeys) {
      loadMessages().catch(console.error);
    }
  }, [hasKeys]);

  async function loadMessages() {
    const res = await ApiClient.get(`/lounge/messages?limit=50`);
    // Backward compatibility: check both 'success' (new) and 'ok' (old) fields
    const isSuccess = res?.success || res?.ok;
    if (!isSuccess) {
      toastApiError(res?.error || 'Failed to load lounge messages');
      return;
    }
    const enc: LoungeMessageEncrypted[] = res.messages || [];
    const views: LoungeMessageView[] = [];
    for (const m of enc) {
      const text = decryptMessage(m);
      if (!text) continue;
      views.push({
        id: m.id,
        content: text,
        sender_id: m.sender_id,
        created_at: m.created_at,
        sender: m.sender
      });
    }
    views.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    setMessages(views);
  }

  // --------- cooldown + scroll ----------
  const startCooldownTicker = () => { const id = setInterval(updateCooldown, 1000); return () => clearInterval(id); };
  const initCooldownFromStorage = () => { const t = localStorage.getItem(STORAGE_KEY); if (t) { lastMessageTimeRef.current = parseInt(t, 10); updateCooldown(); } };
  const updateCooldown = () => {
    const now = Date.now(); const last = lastMessageTimeRef.current;
    if (!last) return setCooldownRemaining(0);
    const elapsed = now - last;
    if (elapsed >= COOLDOWN_MS) { setCooldownRemaining(0); localStorage.removeItem(STORAGE_KEY); }
    else setCooldownRemaining(Math.ceil((COOLDOWN_MS - elapsed) / 1000));
  };
  useEffect(() => { if (isUserAtBottom) scrollToBottom(); }, [messages, isUserAtBottom]);
  const checkIfUserAtBottom = () => {
    const c = messagesContainerRef.current; if (!c) return;
    setIsUserAtBottom(c.scrollHeight - c.scrollTop - c.clientHeight < 100);
  };
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });

  // --------- send ----------
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || cooldownRemaining > 0) return;

    const now = Date.now();
    const since = now - lastMessageTimeRef.current;
    if (since < COOLDOWN_MS) {
      setCooldownRemaining(Math.ceil((COOLDOWN_MS - since) / 1000));
      toastWarn('Please wait before sending another message.');
      return;
    }

    try {
      await ensureRoomKey();
      const content = newMessage.trim();
      setNewMessage('');
      lastMessageTimeRef.current = now;
      localStorage.setItem(STORAGE_KEY, `${now}`);
      setCooldownRemaining(Math.ceil(COOLDOWN_MS / 1000));

      const { nonce, ct } = encryptMessage(content);
      const sig = signNonceCipher(nonce, ct);

      const res = await ApiClient.post('/lounge/messages', {
        ciphertext_b58: bs58.encode(ct),
        nonce_b58: bs58.encode(nonce),
        sig_b58: bs58.encode(sig),
        key_version: latestKeyVersion, // Include key version
      });

      // Backward compatibility: check both 'success' (new) and 'ok' (old) fields
      const isSuccess = res?.success || res?.ok;
      if (!isSuccess) {
        // rollback UI cooldown if server rejected
        setNewMessage(content);
        setCooldownRemaining(0);

        const msg = String(res?.error || '').toLowerCase();

        // fine-grained feedback
        if (msg.includes('wait') || msg.includes('minute')) {
          const m = msg.match(/(\d+)\s*minute/);
          if (m) {
            const mins = parseInt(m[1]);
            setCooldownRemaining(mins * 60);
            toastWarn(`Please wait ${mins} minute(s) before sending another message.`);
          } else {
            toastWarn('Please wait before sending another message.');
          }
        } else if (msg.includes('too many messages')) {
          toastWarn('Too many messages, slow down.');
        } else if (msg.includes('limit')) {
          toastWarn('Message limit reached. You can send up to 100 messages per hour.');
        } else if (msg.includes('links are not allowed')) {
          toastWarn('Links are not allowed in the Lounge.');
        } else if (msg.includes('message too long')) {
          toastWarn(res.error);
        } else if (msg.includes('duplicate')) {
          toastWarn('Duplicate message detected.');
        } else if (res?.error) {
          toastApiError(res.error);
        } else {
          toastApiError('Failed to send message. Please try again.');
        }
      } else {
        // success: WS will render the message
      }
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Failed to send lounge message:', err);
      toastApiError(err?.message || 'Failed to send message. Please try again.');
      setCooldownRemaining(0);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / 36e5;
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // --------- UI ----------
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div
        ref={messagesContainerRef}
        onScroll={checkIfUserAtBottom}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#17ff9a]/10 to-[#10b981]/10 border border-[#17ff9a]/20 flex items-center justify-center mb-4 shadow-lg shadow-[#17ff9a]/5">
              <Users className="w-10 h-10 text-[#17ff9a]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No messages</h3>
            <p className="text-sm text-gray-400 max-w-xs">
              Say hi to the Lounge!
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender_id === userId;
            const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

            return (
              <div
                key={message.id}
                className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwnMessage && (
                  <div className="flex-shrink-0">
                    {showAvatar ? (
                      <button
                        onClick={() => onUserClick?.(message.sender_id)}
                        className="hover:opacity-80 transition-opacity"
                        title={`Message ${message.sender?.username}`}
                      >
                        {message.sender?.profile_picture_url ? (
                          <img
                            src={message.sender.profile_picture_url}
                            alt={message.sender?.username || 'User'}
                            className="w-8 h-8 rounded-full object-cover border border-[#2a2a2a]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center shadow-md">
                            <span className="text-black font-bold text-xs">
                              {(message.sender?.username || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </button>
                    ) : (
                      <div className="w-8 h-8" />
                    )}
                  </div>
                )}
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%] min-w-0`}>
                  {showAvatar && !isOwnMessage && (
                    <button
                      onClick={() => onUserClick?.(message.sender_id)}
                      className="text-xs text-gray-500 hover:text-[#17ff9a] font-medium mb-1 ml-1 transition-colors cursor-pointer"
                    >
                      {message.sender?.username}
                    </button>
                  )}
                  <div
                    className={`
                      rounded-2xl px-4 py-2.5 shadow-lg max-w-full
                      ${isOwnMessage
                        ? 'bg-gradient-to-br from-[#17ff9a] to-[#10b981] text-black shadow-[#17ff9a]/20 rounded-br-md'
                        : 'bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-bl-md'
                      }
                    `}
                  >
                    <p className="text-sm break-all overflow-wrap-anywhere leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-1.5 ${isOwnMessage ? 'text-black/60' : 'text-gray-500'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
                {isOwnMessage && <div className="w-8 flex-shrink-0" />}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 bg-gradient-to-r from-[#111] to-[#0a0a0a] border-t border-[#1a1a1a] p-4 backdrop-blur-xl">
        <form onSubmit={sendMessage} className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 300) setNewMessage(value);
                }}
                placeholder="Message the lounge..."
                maxLength={300}
                className="w-full px-4 py-3 pr-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all"
              />
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${newMessage.length >= 290 ? 'text-orange-400'
                : newMessage.length === 300 ? 'text-red-400'
                  : 'text-gray-500'
                }`}>
                {newMessage.length}/300
              </div>
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || cooldownRemaining > 0}
              className="w-12 h-12 bg-gradient-to-r from-[#17ff9a] to-[#10b981] rounded-xl flex items-center justify-center hover:shadow-xl hover:shadow-[#17ff9a]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none active:scale-95 flex-shrink-0"
            >
              {cooldownRemaining > 0 ? (
                <span className="text-black text-[10px] font-bold leading-tight">
                  {Math.floor(cooldownRemaining / 60)}:{String(cooldownRemaining % 60).padStart(2, '0')}
                </span>
              ) : (
                <Send className="w-5 h-5 text-black" />
              )}
            </button>
          </div>
          {cooldownRemaining > 0 && (
            <p className="text-xs text-gray-400 text-center">
              Please wait {Math.floor(cooldownRemaining / 60)}:{String(cooldownRemaining % 60).padStart(2, '0')} before sending another message
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
