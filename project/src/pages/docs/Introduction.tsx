import DocsLayout from '../../components/DocsLayout';
import { Shield, Zap, Lock, Globe } from 'lucide-react';

export default function Introduction() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          ZKForge Documentation
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Privacy-first blockchain communication powered by Zero-Knowledge proofs
        </p>

        {/* Hero Illustration */}
        <div className="relative my-12 p-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#17ff9a]/5 to-transparent" />
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center mb-3">
                <Shield className="w-8 h-8 text-[#17ff9a]" />
              </div>
              <span className="text-sm font-medium text-white">ZK Proofs</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center mb-3">
                <Zap className="w-8 h-8 text-[#17ff9a]" />
              </div>
              <span className="text-sm font-medium text-white">Fast</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center mb-3">
                <Lock className="w-8 h-8 text-[#17ff9a]" />
              </div>
              <span className="text-sm font-medium text-white">Secure</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center mb-3">
                <Globe className="w-8 h-8 text-[#17ff9a]" />
              </div>
              <span className="text-sm font-medium text-white">Decentralized</span>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">What is ZKForge?</h2>
        <p className="text-gray-300 mb-4">
          ZKForge is a next-generation blockchain platform that combines Zero-Knowledge proof technology
          with Solana's high-performance infrastructure to create a secure, private, and scalable
          communication ecosystem.
        </p>
        <p className="text-gray-300 mb-4">
          Our platform enables users to authenticate, transact, and communicate without exposing
          sensitive information, leveraging cutting-edge cryptographic techniques to ensure maximum
          privacy and security.
        </p>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Core Features</h2>

        <div className="space-y-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-2">🔐 Zero-Knowledge Authentication</h3>
            <p className="text-gray-300">
              Authenticate without revealing your password or secret key. Our ZK-proof system ensures
              that only you can prove ownership of your account without exposing credentials to anyone,
              including our servers.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-2">⚡ Solana Integration</h3>
            <p className="text-gray-300">
              Built on Solana's blazing-fast blockchain infrastructure, ZKForge delivers sub-second
              transaction finality with minimal fees. Your wallet is derived directly from your ZK
              credentials for seamless integration.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-2">💬 Private Messaging</h3>
            <p className="text-gray-300">
              End-to-end encrypted messaging with on-chain verification. Messages are signed with your
              ZK identity and encrypted before transmission, ensuring complete privacy.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-2">🌐 Decentralized Explorer</h3>
            <p className="text-gray-300">
              Real-time blockchain explorer showing all network transactions, block generation, and
              network statistics. Fully transparent while preserving user privacy.
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Why Zero-Knowledge?</h2>
        <p className="text-gray-300 mb-4">
          Traditional authentication systems require you to transmit your password or credentials to
          a server for verification. This creates multiple attack vectors:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
          <li>Server breaches can expose all user credentials</li>
          <li>Man-in-the-middle attacks can intercept passwords</li>
          <li>Service providers have access to user secrets</li>
          <li>Centralized points of failure</li>
        </ul>
        <p className="text-gray-300 mb-4">
          Zero-Knowledge proofs eliminate these vulnerabilities by allowing you to prove you know a
          secret without revealing the secret itself. Even if an attacker intercepts the proof, they
          cannot use it to authenticate as you or derive your credentials.
        </p>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Getting Started</h2>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <ol className="list-decimal list-inside text-gray-300 space-y-3">
            <li>
              <strong className="text-white">Create an account:</strong> Choose a unique username.
              The system generates your ZK keypair and Solana wallet automatically.
            </li>
            <li>
              <strong className="text-white">Secure your secret key:</strong> Save your ZK secret key
              in a secure location. This is the only way to recover your account.
            </li>
            <li>
              <strong className="text-white">Explore the platform:</strong> Use the Lounge for public
              chat, manage your wallet, or explore transactions on the blockchain.
            </li>
            <li>
              <strong className="text-white">Stay private:</strong> Your authentication happens
              client-side. No passwords are ever transmitted.
            </li>
          </ol>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-[#17ff9a]/10 to-transparent border border-[#17ff9a]/20">
          <h3 className="text-xl font-bold text-[#17ff9a] mb-2">Ready to dive deeper?</h3>
          <p className="text-gray-300">
            Continue to the Architecture section to learn about the technical design, or jump to
            ZK Authentication to understand the cryptographic foundations of ZKForge.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
