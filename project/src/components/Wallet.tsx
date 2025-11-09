import { useState, useEffect, useRef } from 'react';
import { WalletStorage, SolanaWalletService } from '../lib/solanaWallet';
import { AuthService, ApiClient, AuthStorage } from '../lib/authService';
import { Copy, Eye, EyeOff, Send, QrCode, AlertTriangle, Check, X, ArrowUpRight, ArrowDownLeft, Info, Clock } from 'lucide-react';
import QRCodeLib from 'qrcode';

interface WalletProps {
  userId: string;
  profile: any;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  currency: string;
  from_address: string;
  to_address: string;
  status: 'pending' | 'completed' | 'failed';
  transaction_hash?: string;
  description?: string;
  created_at: string;
}

export default function Wallet({ userId, profile }: WalletProps) {
  const [walletData, setWalletData] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Send form
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchingRecipient, setSearchingRecipient] = useState(false);

  useEffect(() => {
    const initializeWallet = async () => {
      if (userId) {
        await loadWallet();
        await loadTransactions();
      }
    };
    initializeWallet();
  }, [userId]);

  useEffect(() => {
    if (userId) {
      calculateBalance();
    }
  }, [transactions, userId]);

  // Recipient search (username or address) via /profiles/search?q=
  useEffect(() => {
    const searchRecipients = async () => {
      const q = recipientAddress.trim();
      if (q.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      setSearchingRecipient(true);
      try {
        const res = await ApiClient.get(`/profiles/search?q=${encodeURIComponent(q)}`);
        if (res?.ok) {
          setSearchResults(res.results || []);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearchingRecipient(false);
      }
    };
    const t = setTimeout(searchRecipients, 300);
    return () => clearTimeout(t);
  }, [recipientAddress]);

  useEffect(() => {
    if (showReceiveModal && walletData && qrCanvasRef.current) {
      generateQRCode();
    }
  }, [showReceiveModal, walletData]);

  const loadWallet = async () => {
    let wallet = WalletStorage.getWallet();

    if (!wallet) {
      const zkSecretKey = AuthStorage.getSecretKey?.();
      if (zkSecretKey) {
        try {
          wallet = SolanaWalletService.deriveWalletFromZKSecret(zkSecretKey);
          WalletStorage.saveWallet(wallet);
          WalletStorage.savePublicInfo(wallet.publicKey);
          // (optional) You can update profile.solana_address on backend if you add support in PATCH /profiles
        } catch (error) {
          console.error('Failed to regenerate wallet from ZK secret:', error);
        }
      }
    }

    if (wallet) {
      setWalletData(wallet);
    }
  };

  const calculateBalance = async () => {
    // compute from current transactions state
    const total = transactions
      .filter(tx => tx.status === 'completed')
      .reduce((acc, tx) => acc + (tx.type === 'receive' ? Number(tx.amount) : -Number(tx.amount)), 0);
    setBalance(total);
  };

  const loadTransactions = async () => {
    if (!userId) return;
    try {
      setLoadingTransactions(true);
      const res = await ApiClient.get(`/transactions?limit=20`);
      if (res?.ok) {
        setTransactions(res.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const copyToClipboard = async (text: string, isPrivateKey: boolean = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isPrivateKey) {
        setCopiedPrivateKey(true);
        setTimeout(() => setCopiedPrivateKey(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const generateQRCode = async () => {
    if (!qrCanvasRef.current || !walletData) return;
    try {
      await QRCodeLib.toCanvas(qrCanvasRef.current, walletData.publicKey, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const selectRecipient = (username: string, address: string) => {
    setRecipientAddress(username); // keep UX the same (username shown)
    setShowSearchResults(false);
  };

  const handleSend = async () => {
    if (!recipientAddress || !sendAmount || !userId || !walletData) return;

    const amount = parseFloat(sendAmount);
    if (amount <= 0 || amount > balance) return;

    setSending(true);
    setShowSearchResults(false);

    try {
      // POST /transactions/send : server validates daily cap (5/day), resolves username/address, writes both rows
      const res = await ApiClient.post('/transactions/send', {
        recipient: recipientAddress, // username OR solana address
        amount
      });

      if (!res?.ok) {
        alert(res?.error || 'Transaction failed. Please try again.');
        setSending(false);
        return;
      }

      // Reload transactions + balance
      await loadTransactions();

      setShowSendModal(false);
      setRecipientAddress('');
      setSendAmount('');
      setSearchResults([]);
      setShowSearchResults(false);
    } catch (error) {
      console.error('Send transaction failed:', error);
      alert('Transaction failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const closeSendModal = () => {
    setShowSendModal(false);
    setRecipientAddress('');
    setSendAmount('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleRegenerateWallet = async () => {
    const zkSecretKey = AuthStorage.getSecretKey?.();
    if (!zkSecretKey) {
      alert('No ZK secret key found. Please sign in again.');
      return;
    }

    try {
      const wallet = SolanaWalletService.deriveWalletFromZKSecret(zkSecretKey);
      WalletStorage.saveWallet(wallet);
      WalletStorage.savePublicInfo(wallet.publicKey);

      // (optional) If backend supports it, update solana_address:
      // await ApiClient.patch('/profiles', { solana_address: wallet.publicKey });

      setWalletData(wallet);
    } catch (error) {
      console.error('Failed to regenerate wallet:', error);
      alert('Failed to regenerate wallet. Please try signing in again.');
    }
  };

  if (!walletData) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a] p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#17ff9a]/10 to-[#10b981]/10 border border-[#17ff9a]/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-[#17ff9a]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Wallet Not Found</h3>
          <p className="text-sm text-gray-400 mb-6">
            Your wallet needs to be regenerated from your ZK secret key.
          </p>
          <button
            onClick={handleRegenerateWallet}
            className="px-6 py-3 bg-gradient-to-r from-[#17ff9a] to-[#10b981] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[#17ff9a]/30 transition-all"
          >
            Regenerate Wallet
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Your wallet is deterministically derived from your ZK secret key, so this is completely safe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] overflow-y-auto">
      {/* Balance Card */}
      <div className="p-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-[#2a2a2a] shadow-[0_8px_32px_rgba(0,0,0,0.6),0_-2px_16px_rgba(23,255,154,0.1)]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-gray-400 font-medium">Total Balance</span>
                <span className="text-xs text-[#17ff9a]/70 font-medium mt-0.5">Testnet</span>
              </div>
              <div className="px-3 py-1 bg-[#17ff9a]/10 border border-[#17ff9a]/20 rounded-full">
                <span className="text-xs text-[#17ff9a] font-semibold">USDC</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                ${balance.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500">≈ {balance.toFixed(6)} USDC</p>

              <div className="pt-2 border-t border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Wallet Address</span>
                  <button
                    onClick={() => copyToClipboard(walletData.publicKey)}
                    className="p-1.5 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-[#17ff9a]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-300 font-mono break-all mt-1">
                  {SolanaWalletService.shortenAddress(walletData.publicKey, 8)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setShowSendModal(true)}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#17ff9a] to-[#10b981] transition-all hover:shadow-lg hover:shadow-[#17ff9a]/30 active:scale-95"
          >
            <div className="relative px-4 py-3 flex flex-col items-center justify-center gap-1.5">
              <ArrowUpRight className="w-5 h-5 text-black" />
              <span className="text-black font-bold text-sm">Send</span>
            </div>
          </button>

          <button
            onClick={() => setShowReceiveModal(true)}
            className="group relative overflow-hidden rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] transition-all hover:border-[#17ff9a]/50 hover:shadow-lg hover:shadow-[#17ff9a]/10 active:scale-95"
          >
            <div className="relative px-4 py-3 flex flex-col items-center justify-center gap-1.5">
              <ArrowDownLeft className="w-5 h-5 text-[#17ff9a]" />
              <span className="text-white font-bold text-sm">Receive</span>
            </div>
          </button>

          <button
            onClick={() => setShowDetailsModal(true)}
            className="group relative overflow-hidden rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] transition-all hover:border-[#17ff9a]/50 hover:shadow-lg hover:shadow-[#17ff9a]/10 active:scale-95"
          >
            <div className="relative px-4 py-3 flex flex-col items-center justify-center gap-1.5">
              <Info className="w-5 h-5 text-[#17ff9a]" />
              <span className="text-white font-bold text-sm">Details</span>
            </div>
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
          <span className="text-xs text-gray-500">{transactions.length} total</span>
        </div>

        <div className="space-y-3">
          {loadingTransactions ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-400">Loading transactions...</span>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#17ff9a]/10 to-[#10b981]/10 border border-[#17ff9a]/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-[#17ff9a]" />
              </div>
              <h4 className="text-white font-semibold mb-2">No transactions yet</h4>
              <p className="text-sm text-gray-400">Your transaction history will appear here</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="group rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] p-4 hover:border-[#17ff9a]/30 hover:bg-[#1f1f1f] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'receive'
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-orange-500/10 border border-orange-500/20'
                    }`}>
                      {tx.type === 'receive' ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-orange-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white capitalize">{tx.type}</span>
                        {tx.status === 'pending' && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full">
                            Pending
                          </span>
                        )}
                        {tx.status === 'failed' && (
                          <span className="px-2 py-0.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
                            Failed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 font-mono">
                          {tx.type === 'receive'
                            ? SolanaWalletService.shortenAddress(tx.from_address, 4)
                            : SolanaWalletService.shortenAddress(tx.to_address, 4)}
                        </span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">{formatDate(tx.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-bold ${
                      tx.type === 'receive' ? 'text-green-400' : 'text-white'
                    }`}>
                      {tx.type === 'receive' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">{tx.currency}</div>
                  </div>
                </div>
                {tx.description && (
                  <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                    <p className="text-xs text-gray-400">{tx.description}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] rounded-3xl border border-[#2a2a2a] shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

            <div className="relative">
              <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center">
                    <Send className="w-5 h-5 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Send USDC</h3>
                </div>
                <button onClick={closeSendModal} className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <label className="block text-sm text-gray-400 font-medium mb-2">Recipient (Username or Address)</label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    onFocus={() => recipientAddress.length >= 2 && setShowSearchResults(true)}
                    placeholder="Search username or address..."
                    className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all"
                  />

                  {showSearchResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                      {searchingRecipient ? (
                        <div className="p-4 text-center">
                          <div className="inline-block w-5 h-5 border-2 border-[#17ff9a] border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs text-gray-400 mt-2">Searching...</p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="py-2">
                          {searchResults.map((result) => (
                            <button
                              key={result.id}
                              onClick={() => selectRecipient(result.username, result.solana_address)}
                              className="w-full px-4 py-3 hover:bg-[#2a2a2a] transition-colors text-left flex items-center gap-3"
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center text-black font-bold">
                                {result.username?.charAt(0)?.toUpperCase?.() || 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white">
                                  {result.username ? `@${result.username}` : 'Unknown'}
                                </div>
                                {result.solana_address && (
                                  <div className="text-xs text-gray-500 font-mono truncate">
                                    {SolanaWalletService.shortenAddress(result.solana_address, 6)}
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-xs text-gray-400">No users found</p>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">Start typing to search for users</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 font-medium mb-2">Amount (USDC)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all"
                    />
                    <button
                      onClick={() => setSendAmount(balance.toString())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#17ff9a] font-semibold hover:text-[#10b981] transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Available: {balance.toFixed(6)} USDC</p>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-400">Make sure the recipient address is correct. Transactions cannot be reversed.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowSendModal(false)}
                    className="flex-1 py-3 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 font-semibold rounded-xl hover:bg-[#252525] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!recipientAddress || !sendAmount || sending || parseFloat(sendAmount) > balance}
                    className="flex-1 py-3 bg-gradient-to-r from-[#17ff9a] to-[#10b981] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[#17ff9a]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] rounded-3xl border border-[#2a2a2a] shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

            <div className="relative">
              <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Receive USDC</h3>
                </div>
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-2xl bg-white p-4 shadow-lg">
                    <canvas ref={qrCanvasRef} className="block" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-gray-400 font-medium text-center">Your Wallet Address</label>
                  <div className="p-4 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl">
                    <p className="text-sm text-white font-mono break-all text-center">{walletData.publicKey}</p>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(walletData.publicKey)}
                  className="w-full py-3 bg-gradient-to-r from-[#17ff9a] to-[#10b981] text-black font-bold rounded-xl hover:shadow-lg hover:shadow-[#17ff9a]/30 transition-all flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>

                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-400">Only send USDC (SPL token) to this address on Solana network.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] rounded-3xl border border-[#2a2a2a] shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

            <div className="relative">
              <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#17ff9a] to-[#10b981] flex items-center justify-center">
                    <Info className="w-5 h-5 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Wallet Details</h3>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowPrivateKey(false);
                  }}
                  className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="rounded-xl bg-[#0f0f0f] border border-[#2a2a2a] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Wallet Address</span>
                    <button
                      onClick={() => copyToClipboard(walletData.publicKey)}
                      className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-[#17ff9a]" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-white font-mono break-all leading-relaxed">{walletData.publicKey}</p>
                </div>

                <div className="rounded-xl bg-[#0f0f0f] border border-[#2a2a2a] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Private Key</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(walletData.secretKey, true)}
                        className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                        disabled={!showPrivateKey}
                      >
                        {copiedPrivateKey ? (
                          <Check className="w-4 h-4 text-[#17ff9a]" />
                        ) : (
                          <Copy className={`w-4 h-4 ${showPrivateKey ? 'text-gray-400' : 'text-gray-600'}`} />
                        )}
                      </button>
                      <button
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
                      >
                        {showPrivateKey ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  {showPrivateKey ? (
                    <>
                      <p className="text-sm text-white font-mono break-all mb-4 leading-relaxed">{walletData.secretKey}</p>
                      <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-orange-400 leading-relaxed">Never share your private key with anyone. It gives full access to your wallet and funds.</p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 font-mono">••••••••••••••••••••••••••••••••</p>
                      <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-400 leading-relaxed">Click the eye icon to reveal your private key. Keep it secure.</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowPrivateKey(false);
                  }}
                  className="w-full py-3 bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 font-semibold rounded-xl hover:bg-[#252525] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
