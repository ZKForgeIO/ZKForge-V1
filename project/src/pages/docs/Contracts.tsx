import DocsLayout from '../../components/DocsLayout';

export default function Contracts() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Smart Contracts
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          On-chain programs powering ZKForge's decentralized features
        </p>

        <div className="my-8 p-6 rounded-xl bg-orange-500/5 border border-orange-500/20">
          <p className="text-orange-400 font-medium mb-2">🚧 Under Development</p>
          <p className="text-gray-300 text-sm">
            ZKForge smart contracts are currently in development as part of Phase 3. Check the
            Roadmap for timeline and planned features.
          </p>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Planned Contract Architecture</h2>

        <div className="space-y-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-3">Identity Contract</h3>
            <p className="text-gray-300 mb-4">
              Manages on-chain identity verification using ZK proofs. Users can prove attributes
              about themselves without revealing underlying data.
            </p>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
              <h4 className="text-sm font-bold text-gray-400 mb-2">Features:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Verifiable credentials storage</li>
                <li>• Attribute-based access control</li>
                <li>• Revocation mechanisms</li>
                <li>• Cross-platform identity portability</li>
              </ul>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-3">Token Bridge Contract</h3>
            <p className="text-gray-300 mb-4">
              Enables cross-chain asset transfers with privacy preservation. Bridge assets between
              Solana and other chains while maintaining confidentiality.
            </p>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
              <h4 className="text-sm font-bold text-gray-400 mb-2">Features:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Multi-chain support</li>
                <li>• Privacy-preserving transfers</li>
                <li>• Atomic swaps</li>
                <li>• Liquidity pooling</li>
              </ul>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-3">Escrow Contract</h3>
            <p className="text-gray-300 mb-4">
              Trustless escrow for peer-to-peer transactions with ZK verification. Ensures fair
              exchange without revealing transaction details.
            </p>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
              <h4 className="text-sm font-bold text-gray-400 mb-2">Features:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Conditional release mechanisms</li>
                <li>• Dispute resolution</li>
                <li>• Multi-signature support</li>
                <li>• Time-locked transactions</li>
              </ul>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-3">Governance Contract</h3>
            <p className="text-gray-300 mb-4">
              Decentralized governance with on-chain voting and proposal execution. Community-driven
              protocol upgrades and parameter changes.
            </p>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
              <h4 className="text-sm font-bold text-gray-400 mb-2">Features:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Proposal creation and voting</li>
                <li>• Quadratic voting support</li>
                <li>• Timelock execution</li>
                <li>• Treasury management</li>
              </ul>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Development Approach</h2>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-8">
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-[#17ff9a]">1.</span>
              <div>
                <strong className="text-white">Security First:</strong> All contracts will undergo
                multiple audits by reputable security firms before mainnet deployment.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#17ff9a]">2.</span>
              <div>
                <strong className="text-white">Formal Verification:</strong> Critical contracts will
                be formally verified to mathematically prove correctness.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#17ff9a]">3.</span>
              <div>
                <strong className="text-white">Testnet Deployment:</strong> Extended testing on Solana
                devnet with bug bounty program before mainnet launch.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#17ff9a]">4.</span>
              <div>
                <strong className="text-white">Upgradeable Architecture:</strong> Proxy pattern for
                upgradeability while maintaining security and decentralization.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#17ff9a]">5.</span>
              <div>
                <strong className="text-white">Open Source:</strong> All contract code will be
                publicly available for community review and verification.
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Program Languages</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-white mb-3">Rust</h3>
            <p className="text-gray-300 text-sm mb-3">
              Primary language for Solana programs. Memory-safe, performant, and with excellent
              tooling support.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Frameworks:</strong> Anchor, Solana SDK
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-white mb-3">Anchor</h3>
            <p className="text-gray-300 text-sm mb-3">
              Framework for Solana programs that simplifies development with macros and CLI tools.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Benefits:</strong> IDL Generation, Testing, Deployment
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-[#17ff9a]/10 to-transparent border border-[#17ff9a]/20">
          <h3 className="text-xl font-bold text-[#17ff9a] mb-2">Stay Updated</h3>
          <p className="text-gray-300">
            Smart contract development is tracked in our Roadmap. Join our community to follow
            progress and participate in the design process.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
