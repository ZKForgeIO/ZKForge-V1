import DocsLayout from '../../components/DocsLayout';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

export default function Roadmap() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Development Roadmap
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          ZKForge's phased approach to building the future of private blockchain communication
        </p>

        {/* Phase 1 */}
        <div className="my-12 p-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-[#17ff9a]/50">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#17ff9a]" />
            <div>
              <h2 className="text-2xl font-bold text-white m-0">Phase 1: Foundation</h2>
              <p className="text-sm text-[#17ff9a] m-0">Q4 2024 - Completed ✓</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#17ff9a]/5 border border-[#17ff9a]/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#17ff9a]" />
                Core Authentication
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>✓ Zero-Knowledge proof system</li>
                <li>✓ Ed25519 key generation</li>
                <li>✓ Challenge-response protocol</li>
                <li>✓ Session management</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#17ff9a]/5 border border-[#17ff9a]/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#17ff9a]" />
                Wallet Integration
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>✓ Deterministic wallet derivation</li>
                <li>✓ Solana keypair generation</li>
                <li>✓ Transaction signing</li>
                <li>✓ Balance management</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#17ff9a]/5 border border-[#17ff9a]/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#17ff9a]" />
                Database Architecture
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>✓ PostgreSQL schema design</li>
                <li>✓ Row-Level Security policies</li>
                <li>✓ Real-time subscriptions</li>
                <li>✓ Profile management</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#17ff9a]/5 border border-[#17ff9a]/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#17ff9a]" />
                User Interface
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>✓ Responsive design system</li>
                <li>✓ Authentication flows</li>
                <li>✓ Wallet dashboard</li>
                <li>✓ Profile customization</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Phase 2 */}
        <div className="my-12 p-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-[#17ff9a]/50">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#17ff9a]" />
            <div>
              <h2 className="text-2xl font-bold text-white m-0">Phase 2: Communication</h2>
              <p className="text-sm text-[#17ff9a] m-0">Q4 2024 - Completed ✓</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#17ff9a]/5 border border-[#17ff9a]/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#17ff9a]" />
                Lounge Chat System
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>✓ Real-time messaging</li>
                <li>✓ Message persistence</li>
                <li>✓ User presence system</li>
                <li>✓ Online status tracking</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#17ff9a]/5 border border-[#17ff9a]/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#17ff9a]" />
                Transaction Explorer
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>✓ Live transaction feed</li>
                <li>✓ Block height tracking</li>
                <li>✓ Network statistics</li>
                <li>✓ Search functionality</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#17ff9a]/5 border border-[#17ff9a]/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#17ff9a]" />
                Profile Features
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>✓ Profile picture upload</li>
                <li>✓ Bio customization</li>
                <li>✓ Username display</li>
                <li>✓ Social links</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#17ff9a]/5 border border-[#17ff9a]/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#17ff9a]" />
                Storage System
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>✓ Image storage buckets</li>
                <li>✓ Access policies</li>
                <li>✓ CDN distribution</li>
                <li>✓ Compression pipeline</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Phase 3 */}
        <div className="my-12 p-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-orange-500/50">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-orange-400" />
            <div>
              <h2 className="text-2xl font-bold text-white m-0">Phase 3: Advanced Features</h2>
              <p className="text-sm text-orange-400 m-0">Q1 2025 - In Progress</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#17ff9a]" />
                Private Messaging
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>✓ End-to-end encryption</li>
                <li>⏳ Direct message threads</li>
                <li>⏳ Message read receipts</li>
                <li>⏳ Typing indicators</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Circle className="w-5 h-5 text-orange-400" />
                Group Channels
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>⏳ Private group creation</li>
                <li>⏳ Member management</li>
                <li>⏳ Group permissions</li>
                <li>⏳ Channel moderation</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Circle className="w-5 h-5 text-orange-400" />
                Token Operations
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>⏳ SPL token integration</li>
                <li>⏳ Multi-token support</li>
                <li>⏳ Token swaps</li>
                <li>⏳ Liquidity pools</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Circle className="w-5 h-5 text-orange-400" />
                Advanced Security
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>⏳ Multi-signature support</li>
                <li>⏳ Hardware wallet integration</li>
                <li>⏳ Biometric authentication</li>
                <li>⏳ Session recovery</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Phase 4 */}
        <div className="my-12 p-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-6">
            <Circle className="w-8 h-8 text-gray-400" />
            <div>
              <h2 className="text-2xl font-bold text-white m-0">Phase 4: DeFi Integration</h2>
              <p className="text-sm text-gray-400 m-0">Q2 2025 - Planned</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Circle className="w-5 h-5 text-gray-400" />
                Staking Platform
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>○ Liquid staking</li>
                <li>○ Validator selection</li>
                <li>○ Reward distribution</li>
                <li>○ Auto-compounding</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Circle className="w-5 h-5 text-gray-400" />
                DEX Integration
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>○ Decentralized exchange</li>
                <li>○ Automated market maker</li>
                <li>○ Limit orders</li>
                <li>○ Price charts</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Circle className="w-5 h-5 text-gray-400" />
                Lending Protocol
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>○ Collateralized lending</li>
                <li>○ Interest rate models</li>
                <li>○ Liquidation engine</li>
                <li>○ Credit scoring</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Circle className="w-5 h-5 text-gray-400" />
                Governance System
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>○ DAO structure</li>
                <li>○ Proposal creation</li>
                <li>○ On-chain voting</li>
                <li>○ Treasury management</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Phase 5 */}
        <div className="my-12 p-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-[#2a2a2a]">
          <div className="flex items-center gap-3 mb-6">
            <Circle className="w-8 h-8 text-gray-400" />
            <div>
              <h2 className="text-2xl font-bold text-white m-0">Phase 5: Ecosystem Growth</h2>
              <p className="text-sm text-gray-400 m-0">Q3-Q4 2025 - Future</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Circle className="w-5 h-5 text-gray-400" />
                Developer Tools
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>○ SDK releases (JS, Python, Rust)</li>
                <li>○ API documentation</li>
                <li>○ Integration templates</li>
                <li>○ Developer dashboard</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Circle className="w-5 h-5 text-gray-400" />
                Mobile Applications
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>○ iOS native app</li>
                <li>○ Android native app</li>
                <li>○ Push notifications</li>
                <li>○ Offline mode</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Circle className="w-5 h-5 text-gray-400" />
                Cross-Chain Bridge
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>○ Ethereum bridge</li>
                <li>○ Polygon integration</li>
                <li>○ BSC support</li>
                <li>○ Wormhole protocol</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Circle className="w-5 h-5 text-gray-400" />
                Enterprise Features
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-7">
                <li>○ White-label solutions</li>
                <li>○ Custom deployments</li>
                <li>○ SLA guarantees</li>
                <li>○ Premium support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-12 p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
          <h3 className="text-lg font-bold text-white mb-4">Status Legend</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#17ff9a]" />
              <span className="text-gray-300">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <span className="text-gray-300">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-gray-400" />
              <span className="text-gray-300">Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">⏳</span>
              <span className="text-gray-300">Upcoming</span>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-[#17ff9a]/10 to-transparent border border-[#17ff9a]/20">
          <h3 className="text-xl font-bold text-[#17ff9a] mb-2">Join the Journey</h3>
          <p className="text-gray-300">
            ZKForge is constantly evolving. Follow our progress, contribute to the codebase, or join
            our community to help shape the future of privacy-first blockchain communication.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
