// components/Lounge.tsx
import { useState, useEffect, useRef } from 'react';
import { Send, Users } from 'lucide-react';
import { ApiClient, AuthStorage } from '../lib/authService';
import { WSClient } from '../lib/wsClient';
import { ZKAuthService } from '../lib/zkAuth';
import nacl from 'tweetnacl';
import ed2curve from 'ed2curve';
import bs58 from 'bs58';


interface LoungeMessageEncrypted {
  id: string;
  sender_id: string;
  created_at: string;
  ciphertext_b58: string;
  nonce_b58: string;
  sig_b58?: string;
  sender?: {
    username: string;
    profile_picture_url?: string;
  };
}
interface LoungeMessageView {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    username: string;
    profile_picture_url?: string;
  };
}

interface LoungeProps {
  userId: string;
  profile: any;
  onUserClick?: (userId: string) => void;
}

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
  const roomKeyRef = useRef<Uint8Array | null>(null);
  const edPairRef = useRef<nacl.SignKeyPair | null>(null);

  // --------- helpers: keying & crypto ----------
  function getEdPairFromStorage(): nacl.SignKeyPair {
    if (edPairRef.current) return edPairRef.current;
    const zk = AuthStorage.getSecretKey();
    if (!zk) throw new Error('Missing ZK secret key');
    const sk = ZKAuthService.parseSecretKey(zk); // Uint8Array(64) expanded
    const pair = nacl.sign.keyPair.fromSecretKey(sk);
    edPairRef.current = pair;
    return pair;
  }

  async function ensureRoomKey() {
    if (roomKeyRef.current) return;
    const r = await ApiClient.get('/lounge/key');
    if (!r?.ok) throw new Error(r?.error || 'failed to fetch lounge key');

    const edPair = getEdPairFromStorage();
    const curveSk = ed2curve.convertSecretKey(edPair.secretKey);
    if (!curveSk) throw new Error('ed2curve conversion failed');

    const ephPub = bs58.decode(r.ephPub);
    const nonce = bs58.decode(r.nonce);
    const sealed = bs58.decode(r.sealed);

    const k = nacl.box.open(sealed, nonce, ephPub, curveSk);
    if (!k) throw new Error('failed to unseal room key');
    if (k.length !== 32) throw new Error('bad room key size');

    roomKeyRef.current = new Uint8Array(k);
  }

  function decryptMessage(m: LoungeMessageEncrypted): string | null {
    const k = roomKeyRef.current; if (!k) return null;
    const nonce = bs58.decode(m.nonce_b58);
    const ct = bs58.decode(m.ciphertext_b58);
    const out = nacl.secretbox.open(ct, nonce, k);
    if (!out) return null;
    return new TextDecoder().decode(out);
  }

  function encryptMessage(plain: string) {
    const k = roomKeyRef.current; if (!k) throw new Error('room key not ready');
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const msg = new TextEncoder().encode(plain);
    const ct = nacl.secretbox(msg, nonce, k);
    return { nonce, ct };
  }

  function signNonceCipher(nonce: Uint8Array, ct: Uint8Array) {
    const ed = getEdPairFromStorage();
    const data = new Uint8Array(nonce.length + ct.length);
    data.set(nonce, 0); data.set(ct, nonce.length);
    return nacl.sign.detached(data, ed.secretKey);
  }

  // --------- bootstrap ----------
  useEffect(() => {
    (async () => {
      try {
        await ensureRoomKey();
        await loadMessages();

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
      } catch (e) {
        console.error('[Lounge] bootstrap failed', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMessages() {
    const res = await ApiClient.get(`/lounge/messages?limit=50`);
    if (!res?.ok) return;
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
    if (since < COOLDOWN_MS) { setCooldownRemaining(Math.ceil((COOLDOWN_MS - since) / 1000)); return; }

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
        sig_b58: bs58.encode(sig)
      });

      if (!res?.ok) {
        // rollback UI cooldown if server rejected
        setNewMessage(content);
        setCooldownRemaining(0);
        const msg = String(res?.error || '').toLowerCase();
        if (msg.includes('wait') || msg.includes('minute')) {
          const m = msg.match(/(\d+)\s*minute/);
          if (m) {
            const mins = parseInt(m[1]);
            setCooldownRemaining(mins * 60);
            alert(`Please wait ${mins} minute(s) before sending another message.`);
          } else {
            alert('Please wait before sending another message.');
          }
        } else if (msg.includes('limit')) {
          alert('Message limit reached. You can send up to 100 messages per hour.');
        } else if (msg) {
          alert(`Failed to send message: ${res.error}`);
        } else {
          alert('Failed to send message. Please try again.');
        }
      }
      // On success the WS 'lounge:new' will arrive and render.
    } catch (err) {
      console.error('Failed to send lounge message:', err);
      alert('Failed to send message. Please try again.');
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

  // --------- UI (same as your current component; now messages[].content is decrypted) ----------
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
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                newMessage.length >= 290 ? 'text-orange-400'
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
