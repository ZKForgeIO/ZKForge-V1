import DocsLayout from '../../components/DocsLayout';

export default function TechStack() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Technology Stack
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          The complete tech stack powering ZKForge's privacy-first infrastructure
        </p>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Frontend</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">React 18</h3>
            <p className="text-gray-300 text-sm mb-3">
              Modern React with hooks, concurrent features, and automatic batching for optimal performance.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Features:</strong> Suspense, Server Components, Concurrent Rendering
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">TypeScript</h3>
            <p className="text-gray-300 text-sm mb-3">
              Type-safe development with full IDE support, catching errors at compile time.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Benefits:</strong> IntelliSense, Refactoring, Type Checking
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">Vite</h3>
            <p className="text-gray-300 text-sm mb-3">
              Lightning-fast build tool with hot module replacement and optimized production builds.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Speed:</strong> Instant HMR, Fast Cold Start, Optimized Bundling
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">Tailwind CSS</h3>
            <p className="text-gray-300 text-sm mb-3">
              Utility-first CSS framework for rapid UI development with consistent design.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Features:</strong> JIT Compiler, Custom Themes, Responsive Design
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">React Router</h3>
            <p className="text-gray-300 text-sm mb-3">
              Declarative routing for React applications with nested routes and code splitting.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Features:</strong> Nested Routes, Lazy Loading, Navigation Guards
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">Lucide React</h3>
            <p className="text-gray-300 text-sm mb-3">
              Beautiful, consistent icon library with React components and TypeScript support.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Icons:</strong> 1000+ Icons, Tree-shakeable, Customizable
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Backend & Database</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">Supabase</h3>
            <p className="text-gray-300 text-sm mb-3">
              Open-source Firebase alternative with PostgreSQL, real-time subscriptions, and authentication.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Services:</strong> Database, Auth, Storage, Real-time, Edge Functions
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">PostgreSQL</h3>
            <p className="text-gray-300 text-sm mb-3">
              Advanced open-source relational database with ACID compliance and powerful querying.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Features:</strong> JSONB, Full-text Search, Triggers, RLS
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">Supabase Realtime</h3>
            <p className="text-gray-300 text-sm mb-3">
              WebSocket-based real-time engine for instant data synchronization across clients.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Protocol:</strong> Phoenix Channels, PostgreSQL CDC, Broadcasts
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">Edge Functions</h3>
            <p className="text-gray-300 text-sm mb-3">
              Serverless TypeScript functions deployed globally for low-latency API responses.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Runtime:</strong> Deno, TypeScript, Global CDN
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Blockchain</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">Solana</h3>
            <p className="text-gray-300 text-sm mb-3">
              High-performance blockchain with Proof of History consensus for fast, scalable transactions.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Performance:</strong> 65k TPS, 400ms Blocks, $0.00025 Fees
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">@solana/web3.js</h3>
            <p className="text-gray-300 text-sm mb-3">
              Official Solana JavaScript SDK for interacting with the blockchain.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Features:</strong> Transactions, Accounts, Programs, RPC
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">SPL Token</h3>
            <p className="text-gray-300 text-sm mb-3">
              Solana Program Library token standard for fungible and non-fungible tokens.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Standards:</strong> SPL Token, Token-2022, Associated Token Accounts
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">bs58</h3>
            <p className="text-gray-300 text-sm mb-3">
              Base58 encoding/decoding for Solana addresses and cryptographic keys.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Use:</strong> Address Encoding, Key Serialization
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Cryptography</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">TweetNaCl</h3>
            <p className="text-gray-300 text-sm mb-3">
              Compact, audited cryptography library implementing NaCl primitives in JavaScript.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Algorithms:</strong> Ed25519, X25519, ChaCha20-Poly1305
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">@noble/hashes</h3>
            <p className="text-gray-300 text-sm mb-3">
              High-performance cryptographic hashing library with modern algorithms.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Hashes:</strong> SHA-256, SHA-512, BLAKE3, RIPEMD-160
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">Web Crypto API</h3>
            <p className="text-gray-300 text-sm mb-3">
              Browser-native cryptography for secure random generation and key derivation.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Features:</strong> crypto.randomUUID(), SubtleCrypto
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">Ed25519</h3>
            <p className="text-gray-300 text-sm mb-3">
              Elliptic curve digital signature algorithm for authentication and verification.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Properties:</strong> Fast, Secure, Deterministic
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Development Tools</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">ESLint</h3>
            <p className="text-gray-300 text-sm mb-3">
              Pluggable linting utility for identifying and fixing code quality issues.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Rules:</strong> React Hooks, TypeScript, Code Quality
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">PostCSS</h3>
            <p className="text-gray-300 text-sm mb-3">
              CSS transformation tool for modern features and optimization.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Plugins:</strong> Autoprefixer, TailwindCSS, CSS Nesting
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">Git</h3>
            <p className="text-gray-300 text-sm mb-3">
              Distributed version control for tracking changes and collaboration.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Workflow:</strong> Feature Branches, Pull Requests, CI/CD
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">npm</h3>
            <p className="text-gray-300 text-sm mb-3">
              Package manager for installing and managing JavaScript dependencies.
            </p>
            <div className="text-xs text-gray-400">
              <strong className="text-white">Features:</strong> Lockfile, Scripts, Workspaces
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Architecture Principles</h2>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-8">
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <div>
                <strong className="text-white">Client-Side First:</strong> All sensitive operations
                (key generation, signing, encryption) happen in the browser. Servers never see secrets.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <div>
                <strong className="text-white">Zero Trust:</strong> Assume breach scenarios. Implement
                defense in depth with RLS, encryption, and verification at every layer.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <div>
                <strong className="text-white">Real-Time by Default:</strong> Use WebSocket subscriptions
                for instant updates without polling, reducing latency and server load.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <div>
                <strong className="text-white">Type Safety:</strong> TypeScript throughout the stack
                ensures correctness and catches bugs early in development.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <div>
                <strong className="text-white">Performance:</strong> Code splitting, lazy loading, and
                optimized bundles keep initial load times under 3 seconds.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <div>
                <strong className="text-white">Responsive Design:</strong> Mobile-first approach with
                Tailwind breakpoints ensures perfect experience on all devices.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-[#17ff9a]/10 to-transparent border border-[#17ff9a]/20">
          <h3 className="text-xl font-bold text-[#17ff9a] mb-2">Next: Roadmap</h3>
          <p className="text-gray-300">
            See what's coming next for ZKForge with our detailed development roadmap.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
