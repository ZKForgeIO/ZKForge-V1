import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Background3DGrid from './Background3DGrid';

const UseCases = () => {
  const { elementRef: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { elementRef: cardsRef, isVisible: cardsVisible } = useScrollAnimation();
  const { elementRef: buttonRef, isVisible: buttonVisible } = useScrollAnimation();

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <Background3DGrid />
      <div className="w-full max-w-7xl mx-auto relative z-10">
        <div
          ref={headerRef}
          className={`text-center space-y-4 mb-12 sm:mb-16 scroll-fade-in ${headerVisible ? 'visible' : ''}`}
        >
          <p className="text-xs sm:text-sm font-medium tracking-widest text-gray-400 uppercase">
            Real-World Applications
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
            Privacy Use Cases
          </h2>
          <p className="max-w-4xl mx-auto text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed pt-2">
            ZKForge enables unprecedented quantum-resistant privacy across communication, finance, identity, gaming, and autonomous systems.
          </p>
        </div>

        <div
          ref={cardsRef}
          className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 scroll-fade-up ${cardsVisible ? 'visible' : ''}`}
        >
          <div className="relative group rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden transition-all duration-300 hover:border-[#17ff9a]/50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(23,255,154,0.08),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/30">
                <svg className="w-7 h-7 text-[#17ff9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Private Communication
              </h3>

              <p className="text-sm text-gray-300 leading-relaxed">
                End-to-end encrypted messaging for individuals and enterprises with blockchain-verified message integrity and zero metadata logging.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Quantum-resistant encryption</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>No central servers or storage</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Anonymous by default</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden transition-all duration-300 hover:border-[#17ff9a]/50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(23,255,154,0.08),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/30">
                <svg className="w-7 h-7 text-[#17ff9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Confidential DeFi
              </h3>

              <p className="text-sm text-gray-300 leading-relaxed">
                Private lending, trading, and yield farming with FHE-encrypted balances and positions. No MEV attacks or front-running.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Hidden collateral and debt</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Private credit scoring</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>MEV-resistant transactions</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden transition-all duration-300 hover:border-[#17ff9a]/50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(23,255,154,0.08),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/30">
                <svg className="w-7 h-7 text-[#17ff9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Anonymous Identity
              </h3>

              <p className="text-sm text-gray-300 leading-relaxed">
                Prove credentials, age, location, or membership without revealing personal data using quantum-resistant zkSTARK proofs.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Verifiable credentials</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Selective disclosure</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Decentralized identity</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden transition-all duration-300 hover:border-[#17ff9a]/50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(23,255,154,0.08),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/30">
                <svg className="w-7 h-7 text-[#17ff9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Private Gaming
              </h3>

              <p className="text-sm text-gray-300 leading-relaxed">
                On-chain games with hidden items, encrypted game state, and verifiable randomness without revealing player strategies.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Hidden NFT attributes</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Encrypted game state</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Fair provable randomness</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden transition-all duration-300 hover:border-[#17ff9a]/50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(23,255,154,0.08),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/30">
                <svg className="w-7 h-7 text-[#17ff9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white">
                DAO Voting
              </h3>

              <p className="text-sm text-gray-300 leading-relaxed">
                Anonymous voting with verifiable results. Prove voting eligibility without revealing identity or voting choices.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Private ballot casting</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Verifiable tallying</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Sybil-resistant</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden transition-all duration-300 hover:border-[#17ff9a]/50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(23,255,154,0.08),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/30">
                <svg className="w-7 h-7 text-[#17ff9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white">
                AI Agent Economy
              </h3>

              <p className="text-sm text-gray-300 leading-relaxed">
                Autonomous AI agents conduct private transactions via x402 protocol with zero-friction payments and complete anonymity.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Machine-to-machine payments</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>API micropayments</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-[#17ff9a]" />
                  <span>Autonomous transactions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={buttonRef}
          className={`mt-12 text-center scroll-scale-in ${buttonVisible ? 'visible' : ''}`}
        >
          <button className="px-8 py-4 bg-gradient-to-r from-[#17ff9a] to-[#17ff9a] text-black font-semibold rounded-full hover:shadow-[0_0_40px_rgba(23,255,154,0.5)] transition-all duration-300 hover:scale-105">
            View All Use Cases
          </button>
        </div>
      </div>
    </div>
  );
};

export default UseCases;
