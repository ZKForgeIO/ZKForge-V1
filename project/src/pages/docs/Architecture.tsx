import DocsLayout from '../../components/DocsLayout';
import { Database, Server, Shield, Cpu } from 'lucide-react';

export default function Architecture() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          System Architecture
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Technical overview of ZKForge's infrastructure and design
        </p>

        {/* Architecture Diagram */}
        <div className="my-12 p-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-[#2a2a2a]">
          <h3 className="text-center text-white font-bold mb-8">System Components</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Layer */}
            <div className="p-6 rounded-xl bg-[#17ff9a]/5 border border-[#17ff9a]/20">
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="w-6 h-6 text-[#17ff9a]" />
                <h4 className="text-lg font-bold text-white">Client Layer</h4>
              </div>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• React + TypeScript Frontend</li>
                <li>• ZK Proof Generation (Client-side)</li>
                <li>• Solana Wallet Management</li>
                <li>• End-to-End Encryption</li>
                <li>• Local Key Storage</li>
              </ul>
            </div>

            {/* Backend Layer */}
            <div className="p-6 rounded-xl bg-orange-500/5 border border-orange-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-6 h-6 text-orange-400" />
                <h4 className="text-lg font-bold text-white">Backend Layer</h4>
              </div>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Supabase PostgreSQL</li>
                <li>• Real-time Subscriptions</li>
                <li>• Row-Level Security</li>
                <li>• Edge Functions</li>
                <li>• Storage Buckets</li>
              </ul>
            </div>

            {/* Blockchain Layer */}
            <div className="p-6 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-purple-400" />
                <h4 className="text-lg font-bold text-white">Blockchain Layer</h4>
              </div>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Solana Mainnet/Devnet</li>
                <li>• SPL Token Standard</li>
                <li>• On-chain Transactions</li>
                <li>• Wallet Derivation</li>
                <li>• Transaction Signing</li>
              </ul>
            </div>

            {/* Cryptography Layer */}
            <div className="p-6 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-400" />
                <h4 className="text-lg font-bold text-white">Cryptography Layer</h4>
              </div>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Ed25519 Signatures</li>
                <li>• SHA-256 Hashing</li>
                <li>• TweetNaCl Library</li>
                <li>• Challenge-Response Protocol</li>
                <li>• Deterministic Key Derivation</li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Data Flow</h2>

        <div className="space-y-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">1. Authentication Flow</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">1</span>
                <p>User enters ZK secret key in client application</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">2</span>
                <p>Client derives public key and generates ZK proof locally</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">3</span>
                <p>Server receives proof and verifies without accessing secret key</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">4</span>
                <p>Session token issued upon successful verification</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">5</span>
                <p>Solana wallet automatically derived from ZK credentials</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">2. Transaction Flow</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">1</span>
                <p>User initiates transaction from wallet interface</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">2</span>
                <p>Client creates and signs transaction with Solana keypair</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">3</span>
                <p>Transaction recorded in Supabase with pending status</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">4</span>
                <p>Real-time update broadcasts to all connected clients</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">5</span>
                <p>Explorer displays transaction with censored hash for privacy</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">3. Messaging Flow</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">1</span>
                <p>User composes message in Lounge interface</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">2</span>
                <p>Message signed with ZK identity for authentication</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">3</span>
                <p>Stored in database with user profile association</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">4</span>
                <p>Real-time broadcast to all Lounge participants via Supabase</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#17ff9a]/20 text-[#17ff9a] flex items-center justify-center text-xs font-bold">5</span>
                <p>Profile pictures and metadata loaded from storage</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Security Model</h2>
        <p className="text-gray-300 mb-6">
          ZKForge implements multiple layers of security to protect user data and ensure system integrity:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-white mb-3">Client-Side Security</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>✓ Keys never leave the client</li>
              <li>✓ Local proof generation</li>
              <li>✓ Encrypted local storage</li>
              <li>✓ Secure random generation</li>
              <li>✓ Memory-safe operations</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-white mb-3">Server-Side Security</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>✓ Row-Level Security (RLS)</li>
              <li>✓ Zero-knowledge verification</li>
              <li>✓ Rate limiting</li>
              <li>✓ Input validation</li>
              <li>✓ Secure session management</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-white mb-3">Database Security</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>✓ Encrypted at rest</li>
              <li>✓ Policy-based access control</li>
              <li>✓ Audit logging</li>
              <li>✓ Automated backups</li>
              <li>✓ Isolation between users</li>
            </ul>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-white mb-3">Network Security</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>✓ TLS/HTTPS encryption</li>
              <li>✓ CORS protection</li>
              <li>✓ DDoS mitigation</li>
              <li>✓ Real-time monitoring</li>
              <li>✓ Intrusion detection</li>
            </ul>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Scalability</h2>
        <p className="text-gray-300 mb-4">
          The architecture is designed to scale horizontally across all layers:
        </p>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-8">
          <div className="space-y-4 text-gray-300">
            <div>
              <strong className="text-white">Database:</strong> Supabase PostgreSQL with read replicas
              and connection pooling ensures high throughput for concurrent users.
            </div>
            <div>
              <strong className="text-white">Real-time:</strong> Supabase Realtime uses Phoenix channels
              to efficiently broadcast updates to thousands of concurrent connections.
            </div>
            <div>
              <strong className="text-white">Blockchain:</strong> Solana's proof-of-history consensus
              enables 65,000+ transactions per second with sub-second finality.
            </div>
            <div>
              <strong className="text-white">Storage:</strong> Distributed object storage with CDN
              caching for profile pictures and static assets.
            </div>
            <div>
              <strong className="text-white">Compute:</strong> Stateless edge functions deploy globally
              for low-latency API responses.
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-[#17ff9a]/10 to-transparent border border-[#17ff9a]/20">
          <h3 className="text-xl font-bold text-[#17ff9a] mb-2">Next: Deep Dive into ZK Authentication</h3>
          <p className="text-gray-300">
            Learn about the cryptographic protocols that power ZKForge's authentication system.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
