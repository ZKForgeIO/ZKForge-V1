import { useState } from 'react';

interface TechContent {
  title: string;
  description: string;
  features: string[];
  icon: JSX.Element;
}

const TechnologyStack = () => {
  const [activeTab, setActiveTab] = useState(0);

  const technologies: TechContent[] = [
    {
      title: 'zkSTARK Proofs',
      description: 'ZKForge leverages zkSTARK (Zero-Knowledge Scalable Transparent Arguments of Knowledge) technology to enable verification without revelation. Unlike zkSNARKs, zkSTARKs require no trusted setup ceremony and are quantum-resistant, using collision-resistant hash functions instead of elliptic curve cryptography. Users can prove credentials, validate transactions, and interact with services while maintaining complete anonymity with future-proof security.',
      features: [
        'Prove credentials without revealing identity',
        'No trusted setup required - fully transparent',
        'Quantum-resistant cryptographic primitives',
        'Transparent and scalable proof generation'
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: 'Fully Homomorphic Encryption',
      description: 'FHE allows computation on encrypted data without ever decrypting it, enabling smart contracts and applications to process sensitive information while keeping it confidential throughout the entire lifecycle. This revolutionary cryptographic technique means your private data never needs to be exposed, even during complex calculations and operations.',
      features: [
        'Compute on encrypted data without decryption',
        'Preserve privacy throughout computation lifecycle',
        'Enable confidential smart contract execution',
        'Support complex operations on encrypted values'
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: 'Encrypted Messenger',
      description: 'End-to-end encrypted messaging with blockchain verification and zero metadata logging. Messages are encrypted using quantum-resistant algorithms, with zkSTARK proofs ensuring authenticity without revealing sender identity. No central servers store your conversations, and all message routing happens through a decentralized network.',
      features: [
        'Quantum-resistant end-to-end encryption',
        'Zero metadata collection or logging',
        'Blockchain-verified message integrity',
        'Decentralized message routing and delivery'
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      title: 'Privacy dApp Framework',
      description: 'Build decentralized applications with built-in privacy using FHE smart contracts. Developers can create dApps where user data remains encrypted on-chain, computation happens on encrypted values, and results are verifiable without exposing underlying information. Perfect for DeFi, gaming, identity, and any application requiring confidential state.',
      features: [
        'FHE-enabled smart contract execution',
        'Encrypted on-chain state management',
        'Private transaction processing',
        'Developer-friendly SDK and tools'
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      title: 'x402 Integration Layer',
      description: 'The x402 protocol enables anonymous, frictionless payments over HTTP, perfect for AI agents and autonomous systems. Based on HTTP status code 402 (Payment Required), this protocol layer allows machine-to-machine micropayments with complete privacy, enabling a new economy of autonomous services and API monetization.',
      features: [
        'HTTP 402-based payment protocol',
        'Anonymous micropayment channels',
        'Machine-to-machine transaction support',
        'Zero-friction API monetization'
      ],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid lg:grid-cols-[auto_1fr] gap-6 lg:gap-8">
      {/* Left Tabs */}
      <div className="flex flex-col gap-3 lg:min-w-[320px]">
        {technologies.map((tech, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`group flex items-center gap-3 px-5 py-4 rounded-lg transition-all duration-300 ${
              activeTab === index
                ? 'bg-gradient-to-r from-[#17ff9a]/10 to-[#17ff9a]/5 border-l-4 border-[#17ff9a]'
                : 'bg-[#1a1a1a]/50 border-l-4 border-transparent hover:bg-[#1a1a1a] hover:border-gray-600'
            }`}
          >
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-300 ${
                activeTab === index
                  ? 'bg-[#17ff9a]/20 border-[#17ff9a]/30 text-[#17ff9a]'
                  : 'bg-gray-700/20 border-gray-700/30 text-gray-400 group-hover:bg-gray-700/30'
              }`}
            >
              {tech.icon}
            </div>
            <span
              className={`text-left text-sm sm:text-base font-semibold transition-colors duration-300 ${
                activeTab === index ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`}
            >
              {tech.title}
            </span>
          </button>
        ))}
      </div>

      {/* Right Content Panel */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] overflow-hidden min-h-[400px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(23,255,154,0.1),transparent_50%)]" />

        <div className="relative p-6 sm:p-8 lg:p-10 space-y-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            {technologies[activeTab].title}
          </h3>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            {technologies[activeTab].description}
          </p>

          <div className="space-y-3 pt-2">
            {technologies[activeTab].features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#17ff9a] mt-2" />
                <p className="text-sm sm:text-base text-gray-300">
                  <span className="font-semibold text-white">{feature}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Decorative Visualization */}
          <div className="relative mt-8 pt-8 border-t border-gray-800">
            <div className="flex items-center justify-center gap-8 opacity-30">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-[#17ff9a]/50" />
                <div className="w-12 h-1 bg-gradient-to-r from-[#17ff9a]/50 to-transparent" />
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-lg border-2 border-[#17ff9a]/50 bg-[#17ff9a]/10" />
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-[#17ff9a]/50 to-transparent" />
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-[#17ff9a]/50" />
                <div className="w-12 h-1 bg-gradient-to-l from-[#17ff9a]/50 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologyStack;
