import GridAnimation from './components/GridAnimation';
import CoreFeatures from './components/CoreFeatures';
import UseCases from './components/UseCases';
import Background3DGrid from './components/Background3DGrid';
import TechnologyStack from './components/TechnologyStack';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import AnimatedGlobe from './components/AnimatedGlobe';
import { useScrollAnimation } from './hooks/useScrollAnimation';

function App() {
  const { elementRef: zkstarkRef, isVisible: zkstarkVisible } = useScrollAnimation();
  const { elementRef: techRef, isVisible: techVisible } = useScrollAnimation();
  const { elementRef: howItWorksRef, isVisible: howItWorksVisible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* Navbar */}
      <Navbar />
      {/* Hero Section */}
      <div className="relative flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-12 lg:pb-16 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-[#17ff9a] rounded-full blur-[150px] opacity-30" />
        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(23,255,154,0.1),transparent_50%)]" />
            <GridAnimation />

            <div className="relative px-4 py-8 sm:px-8 sm:py-16 lg:px-20 lg:py-24">
              <div className="text-center space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <div className="inline-block px-6 py-2.5 rounded-full bg-[#0d3d2a] border border-[#17ff9a]/30">
                      <p className="text-xs sm:text-sm font-semibold tracking-wider text-[#17ff9a] uppercase">
                        zkSTARK + FHE Privacy Ecosystem
                      </p>
                    </div>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  <span className="block text-white">
                    Private by design.
                  </span>
                  <span className="block text-white mt-2">
                    Anonymous by default.
                  </span>
                </h1>

                <p className="max-w-3xl mx-auto text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">
                  ZKForge is a complete privacy ecosystem combining zkSTARK proofs and Fully Homomorphic Encryption to enable encrypted messaging, privacy-preserving dApps, and confidential transactions through the x402 protocol layer.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6">
                  <button className="group relative w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-[#17ff9a] to-[#17ff9a] text-black font-semibold rounded-full hover:shadow-[0_0_40px_rgba(23,255,154,0.5)] transition-all duration-300 hover:scale-105">
                    <span className="flex items-center justify-center gap-2">
                      Enter Private Zone
                      <svg
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>

                  <button className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-transparent border-2 border-gray-700 text-white font-semibold rounded-full hover:border-gray-500 hover:bg-[#1a1a1a] transition-all duration-300">
                    Documentation
                  </button>
                </div>

                <div className="pt-4 sm:pt-8">
                  <p className="text-xs sm:text-sm tracking-wider text-gray-500 uppercase">
                    Encrypted Messenger • Privacy dApps • x402 Protocol Layer
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#17ff9a]/50 to-transparent" />
          </div>
        </div>
      </div>

      {/* What is ZKForge Section */}
      <div
        ref={zkstarkRef}
        className={`relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 scroll-fade-up ${zkstarkVisible ? 'visible' : ''}`}
      >
        <Background3DGrid />
        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(23,255,154,0.08),transparent_50%)]" />

            <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-12 px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-20">
              {/* Left Content */}
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <p className="text-xs sm:text-sm font-medium tracking-widest text-gray-400 uppercase">
                    What is ZKForge
                  </p>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                    The Complete Privacy Ecosystem
                  </h2>
                </div>

                <div className="space-y-4 text-sm sm:text-base text-gray-300 leading-relaxed">
                  <p>
                    ZKForge combines zkSTARK proofs and Fully Homomorphic Encryption to deliver unprecedented privacy across encrypted messaging, privacy-preserving dApps, and the x402 protocol layer.
                  </p>
                  <p>
                    zkSTARK proofs are quantum-resistant and require no trusted setup, enabling verification without revealing data. FHE allows computation on encrypted data without decryption, keeping information confidential throughout its entire lifecycle.
                  </p>
                  <p>
                    Built for performance and scalability, ZKForge creates a trustless, quantum-resistant privacy layer for Web3, enabling secure communication and confidential computing without compromising speed or user experience.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <button className="px-6 py-3 bg-transparent border-2 border-gray-700 text-white font-semibold rounded-full hover:border-[#17ff9a] hover:bg-[#1a1a1a] transition-all duration-300">
                    Technical Documentation
                  </button>
                  <button className="px-6 py-3 bg-gradient-to-r from-[#17ff9a] to-[#17ff9a] text-black font-semibold rounded-full hover:shadow-[0_0_30px_rgba(23,255,154,0.4)] transition-all duration-300">
                    Try the Ecosystem
                  </button>
                </div>
              </div>

              {/* Right Illustration */}
              <div className="flex items-center justify-center lg:justify-end mt-8 lg:mt-0">
                <div className="w-full aspect-square max-w-[300px] sm:max-w-[400px] lg:max-w-lg">
                  <AnimatedGlobe />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features Section */}
      <CoreFeatures />

      {/* Technology Section */}
      <div
        ref={techRef}
        className={`relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 scroll-fade-up ${techVisible ? 'visible' : ''}`}
      >
        <Background3DGrid />
        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-medium tracking-widest text-gray-400 uppercase">
              Technology
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
              Privacy Technology Stack
            </h2>
            <p className="max-w-4xl mx-auto text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed pt-2">
              ZKForge's technological foundation combines quantum-resistant zkSTARK proofs and Fully Homomorphic Encryption to create an unprecedented privacy layer for encrypted communication, confidential computing, and anonymous transactions.
            </p>
          </div>

          <TechnologyStack />
        </div>
      </div>

      {/* How It Works Section */}
      <div
        ref={howItWorksRef}
        className={`relative px-4 sm:px-6 lg:px-8 py-12 sm:py-20 scroll-fade-up ${howItWorksVisible ? 'visible' : ''}`}
      >
        <Background3DGrid />
        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <p className="text-sm sm:text-base font-medium tracking-wider text-gray-400 uppercase">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Complete Privacy Across the Ecosystem
            </h2>
          </div>

          <div className="relative rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden">
            <div className="relative px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
              {/* Network Visualization - Desktop */}
              <div className="hidden lg:block relative h-[600px] mb-8">
                {/* Orbital Rings */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
                  {/* Outer Ring */}
                  <ellipse
                    cx="400"
                    cy="300"
                    rx="320"
                    ry="200"
                    fill="none"
                    stroke="rgba(75, 85, 99, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="8 8"
                  />
                  {/* Middle Ring */}
                  <ellipse
                    cx="400"
                    cy="300"
                    rx="220"
                    ry="140"
                    fill="none"
                    stroke="rgba(75, 85, 99, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="8 8"
                  />
                  {/* Inner Ring */}
                  <ellipse
                    cx="400"
                    cy="300"
                    rx="120"
                    ry="80"
                    fill="none"
                    stroke="rgba(75, 85, 99, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="8 8"
                  />

                  {/* Connecting Lines */}
                  <line x1="200" y1="200" x2="400" y2="300" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="400" y1="120" x2="400" y2="300" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="600" y1="180" x2="400" y2="300" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="180" y1="420" x2="400" y2="300" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="620" y1="400" x2="400" y2="300" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Center Node */}
                  <circle cx="400" cy="300" r="8" fill="#17ff9a" className="animate-pulse" />
                  <circle cx="400" cy="300" r="16" fill="none" stroke="#17ff9a" strokeWidth="2" opacity="0.3" />

                  {/* Orbital Nodes */}
                  <circle cx="200" cy="200" r="6" fill="#17ff9a" />
                  <circle cx="400" cy="120" r="6" fill="#10b981" />
                  <circle cx="600" cy="180" r="6" fill="#10b981" />
                  <circle cx="180" cy="420" r="6" fill="#10b981" />
                  <circle cx="620" cy="400" r="6" fill="#10b981" />
                </svg>

                {/* Feature Cards - Desktop Positioned */}
                <div className="absolute top-8 left-8 max-w-xs">
                  <div className="bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#17ff9a]/30 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">zkSTARK Identity</h3>
                    <p className="text-sm text-gray-400">
                      Prove who you are or what you own without revealing any personal information using quantum-resistant zkSTARK proofs.
                    </p>
                  </div>
                </div>

                <div className="absolute top-8 right-8 max-w-xs">
                  <div className="bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#17ff9a]/30 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">Encrypted Communication</h3>
                    <p className="text-sm text-gray-400">
                      Send messages with end-to-end encryption, blockchain verification, and zero metadata logging.
                    </p>
                  </div>
                </div>

                <div className="absolute top-1/2 left-8 -translate-y-1/2 max-w-xs">
                  <div className="bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#17ff9a]/30 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">FHE Computation</h3>
                    <p className="text-sm text-gray-400">
                      Process encrypted data in smart contracts without ever decrypting it, enabling truly private dApps.
                    </p>
                  </div>
                </div>

                <div className="absolute top-1/2 right-8 -translate-y-1/2 max-w-xs">
                  <div className="bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#17ff9a]/30 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">x402 Payments</h3>
                    <p className="text-sm text-gray-400">
                      Enable frictionless, anonymous blockchain payments via HTTP 402 for AI agents and services.
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-xs">
                  <div className="bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#17ff9a]/30 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">Composable Privacy</h3>
                    <p className="text-sm text-gray-400">
                      All three features work together seamlessly, creating a complete privacy layer for Web3.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="lg:hidden space-y-6">
                {/* Center Visualization */}
                <div className="relative h-64 sm:h-80 mb-8">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
                    <ellipse cx="200" cy="150" rx="140" ry="90" fill="none" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="6 6" />
                    <ellipse cx="200" cy="150" rx="90" ry="60" fill="none" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="6 6" />
                    <ellipse cx="200" cy="150" rx="45" ry="30" fill="none" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="6 6" />

                    <line x1="100" y1="100" x2="200" y2="150" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="200" y1="60" x2="200" y2="150" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="300" y1="90" x2="200" y2="150" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="90" y1="210" x2="200" y2="150" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="310" y1="200" x2="200" y2="150" stroke="rgba(75, 85, 99, 0.3)" strokeWidth="1" strokeDasharray="3 3" />

                    <circle cx="200" cy="150" r="6" fill="#17ff9a" className="animate-pulse" />
                    <circle cx="200" cy="150" r="12" fill="none" stroke="#17ff9a" strokeWidth="1.5" opacity="0.3" />

                    <circle cx="100" cy="100" r="4" fill="#17ff9a" />
                    <circle cx="200" cy="60" r="4" fill="#10b981" />
                    <circle cx="300" cy="90" r="4" fill="#10b981" />
                    <circle cx="90" cy="210" r="4" fill="#10b981" />
                    <circle cx="310" cy="200" r="4" fill="#10b981" />
                  </svg>
                </div>

                {/* Feature Cards - Mobile Stack */}
                <div className="space-y-4">
                  <div className="bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#17ff9a]/30 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">zkSTARK Identity</h3>
                    <p className="text-sm text-gray-400">
                      Prove who you are or what you own without revealing any personal information using quantum-resistant zkSTARK proofs.
                    </p>
                  </div>

                  <div className="bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#17ff9a]/30 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">Encrypted Communication</h3>
                    <p className="text-sm text-gray-400">
                      Send messages with end-to-end encryption, blockchain verification, and zero metadata logging.
                    </p>
                  </div>

                  <div className="bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#17ff9a]/30 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">FHE Computation</h3>
                    <p className="text-sm text-gray-400">
                      Process encrypted data in smart contracts without ever decrypting it, enabling truly private dApps.
                    </p>
                  </div>

                  <div className="bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#17ff9a]/30 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">x402 Payments</h3>
                    <p className="text-sm text-gray-400">
                      Enable frictionless, anonymous blockchain payments via HTTP 402 for AI agents and services.
                    </p>
                  </div>

                  <div className="bg-[#1a1a1a]/90 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#17ff9a]/30 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">Composable Privacy</h3>
                    <p className="text-sm text-gray-400">
                      All three features work together seamlessly, creating a complete privacy layer for Web3.
                    </p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#17ff9a]" />
                  <span className="text-sm text-gray-400">Active node</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 border-t border-dashed border-gray-600" />
                  <span className="text-sm text-gray-400">Encrypted route</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border border-[#17ff9a] bg-[#17ff9a]/20" />
                  <span className="text-sm text-gray-400">Zero-knowledge proof</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <UseCases />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
