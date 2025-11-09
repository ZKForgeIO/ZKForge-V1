import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowUpRight, ArrowDownLeft, Clock, Search, TrendingUp, Activity, Users, DollarSign, Blocks } from 'lucide-react';
import { SolanaWalletService } from '../lib/solanaWallet';

interface Transaction {
  id: string;
  user_id: string;
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

interface Profile {
  username: string;
  solana_address: string;
}

export default function Explorer() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    blockHeight: 245891234, // Starting block height
    totalTransactions: 0,
    totalVolume: 0,
    activeUsers: 0,
    avgTransaction: 0,
  });

  const truncateHash = (hash: string, startChars = 8, endChars = 8) => {
    if (!hash || hash.length <= startChars + endChars) return hash;
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
  };

  useEffect(() => {
    loadExplorerData();

    // Simulate block generation (every 2-5 seconds)
    const blockInterval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        blockHeight: prev.blockHeight + 1
      }));
    }, Math.random() * 3000 + 2000); // Random between 2-5 seconds

    // Subscribe to new transactions
    const channel = supabase
      .channel('explorer_transactions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions'
      }, () => {
        loadExplorerData();
      })
      .subscribe();

    return () => {
      clearInterval(blockInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const loadExplorerData = async () => {
    try {
      setLoading(true);

      // Load recent transactions for display
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (txError) throw txError;

      // Load all profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, solana_address');

      if (profileError) throw profileError;

      const profileMap = new Map<string, Profile>();
      profileData?.forEach((profile) => {
        profileMap.set(profile.solana_address, profile);
      });

      setProfiles(profileMap);
      setTransactions(txData || []);

      // Get total transaction count
      const { count: totalTxCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      // Get total volume from all completed transactions
      const { data: allCompleted } = await supabase
        .from('transactions')
        .select('amount')
        .eq('status', 'completed');

      const totalVolume = allCompleted?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      // Get total unique users count
      const totalUsers = profileData?.length || 0;

      // Calculate average transaction
      const avgTransaction = allCompleted && allCompleted.length > 0
        ? totalVolume / allCompleted.length
        : 0;

      setStats(prev => ({
        ...prev,
        totalTransactions: totalTxCount || 0,
        totalVolume,
        activeUsers: totalUsers,
        avgTransaction,
      }));
    } catch (error) {
      console.error('Failed to load explorer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getAddressOrUsername = (address: string): string => {
    const profile = profiles.get(address);
    return profile ? `@${profile.username}` : SolanaWalletService.shortenAddress(address, 4);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.transaction_hash?.toLowerCase().includes(query) ||
      tx.from_address.toLowerCase().includes(query) ||
      tx.to_address.toLowerCase().includes(query) ||
      getAddressOrUsername(tx.from_address).toLowerCase().includes(query) ||
      getAddressOrUsername(tx.to_address).toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#2a2a2a]">
        <div className="w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Block Explorer
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Real-time ZK-authenticated transactions</p>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#17ff9a] focus:ring-2 focus:ring-[#17ff9a]/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Box */}
      <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-8">
        <div className="relative overflow-hidden rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-[#2a2a2a] mb-3 sm:mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="relative grid grid-cols-2 sm:flex gap-3 sm:gap-6 p-3 sm:p-6 sm:justify-around">
            {/* Blocks */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center flex-shrink-0">
                <Blocks className="w-4 h-4 sm:w-6 sm:h-6 text-[#17ff9a]" />
              </div>
              <div className="flex flex-col">
                <div className="text-base sm:text-2xl lg:text-3xl font-bold text-white">{stats.blockHeight.toLocaleString()}</div>
                <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Blocks</div>
              </div>
            </div>

            {/* Transactions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-[#17ff9a]" />
              </div>
              <div className="flex flex-col">
                <div className="text-base sm:text-2xl lg:text-3xl font-bold text-white">{stats.totalTransactions}</div>
                <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">TX</div>
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-[#17ff9a]" />
              </div>
              <div className="flex flex-col">
                <div className="text-base sm:text-2xl lg:text-3xl font-bold text-white">${stats.totalVolume.toLocaleString()}</div>
                <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Volume</div>
              </div>
            </div>

            {/* Users */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-[#17ff9a]" />
              </div>
              <div className="flex flex-col">
                <div className="text-base sm:text-2xl lg:text-3xl font-bold text-white">{stats.activeUsers}</div>
                <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="relative overflow-hidden rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-[#2a2a2a]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

          <div className="relative">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-[#2a2a2a]">
              <h2 className="text-base sm:text-lg font-bold text-white">Latest Transactions</h2>
            </div>

            <div className="divide-y divide-[#2a2a2a]">
              {loading ? (
                <div className="flex items-center justify-center py-12 sm:py-16">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400 animate-spin" />
                    <span className="text-sm text-gray-400">Loading...</span>
                  </div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <p className="text-gray-400 text-sm">No transactions found</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="px-3 sm:px-6 py-3 sm:py-5 hover:bg-[#1f1f1f] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0 overflow-hidden">
                        <div className={`flex-shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${
                          tx.type === 'receive'
                            ? 'bg-[#17ff9a]/10 border border-[#17ff9a]/20'
                            : 'bg-orange-500/10 border border-orange-500/20'
                        }`}>
                          {tx.type === 'receive' ? (
                            <ArrowDownLeft className="w-4 h-4 sm:w-6 sm:h-6 text-[#17ff9a]" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 sm:w-6 sm:h-6 text-orange-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                            <span className="text-xs sm:text-base font-mono text-gray-300 break-all sm:truncate">
                              <span className="hidden sm:inline">{tx.transaction_hash || 'No hash'}</span>
                              <span className="inline sm:hidden">{truncateHash(tx.transaction_hash || 'No hash', 6, 6)}</span>
                            </span>
                            {tx.status === 'completed' && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] sm:text-xs bg-[#17ff9a]/10 border border-[#17ff9a]/20 text-[#17ff9a] rounded-full">
                                ✓
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-sm text-gray-500">
                            <span className="truncate max-w-[80px] sm:max-w-[200px]">{getAddressOrUsername(tx.from_address)}</span>
                            <span>→</span>
                            <span className="truncate max-w-[80px] sm:max-w-[200px]">{getAddressOrUsername(tx.to_address)}</span>
                          </div>

                          {tx.description && (
                            <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 truncate">{tx.description}</p>
                          )}

                          <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:hidden">
                            {formatDate(tx.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className={`text-sm sm:text-xl font-bold ${
                          tx.type === 'receive' ? 'text-[#17ff9a]' : 'text-white'
                        }`}>
                          {tx.type === 'receive' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </div>
                        <div className="text-[9px] sm:text-xs text-gray-500">{tx.currency}</div>
                        <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 hidden sm:block">
                          {formatDate(tx.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
