import DocsLayout from '../../components/DocsLayout';

export default function Solana() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Solana Integration
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Leveraging Solana's high-performance blockchain for fast, low-cost transactions
        </p>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Why Solana?</h2>
        <p className="text-gray-300 mb-4">
          Solana was chosen as the blockchain infrastructure for ZKForge due to its exceptional
          performance characteristics and developer-friendly ecosystem:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">⚡ High Throughput</h3>
            <p className="text-gray-300 text-sm">
              65,000+ transactions per second with Proof of History consensus, enabling real-time
              interactions without network congestion.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">💰 Low Fees</h3>
            <p className="text-gray-300 text-sm">
              Average transaction cost of $0.00025, making microtransactions and frequent operations
              economically viable.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">🚀 Fast Finality</h3>
            <p className="text-gray-300 text-sm">
              Sub-second block times with 400ms confirmation, providing near-instant transaction
              finality for responsive user experience.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-[#17ff9a] mb-3">🔧 Developer Tools</h3>
            <p className="text-gray-300 text-sm">
              Comprehensive SDKs, CLI tools, and documentation make building and deploying Solana
              programs straightforward.
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Wallet Derivation</h2>
        <p className="text-gray-300 mb-4">
          ZKForge employs a deterministic wallet derivation system that generates Solana keypairs
          directly from users' ZK secret keys. This creates a seamless experience where one secret
          controls both authentication and blockchain transactions.
        </p>

        <div className="my-8 p-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-[#2a2a2a]">
          <h3 className="text-white font-bold mb-6">Derivation Process</h3>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center">
                <span className="text-[#17ff9a] font-bold text-sm">1</span>
              </div>
              <div>
                <div className="font-mono text-sm text-[#17ff9a] mb-1">Hash ZK Secret</div>
                <div className="text-gray-300 text-sm">
                  Apply SHA-256 to ZK secret key to generate deterministic seed
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center">
                <span className="text-[#17ff9a] font-bold text-sm">2</span>
              </div>
              <div>
                <div className="font-mono text-sm text-[#17ff9a] mb-1">Generate Keypair</div>
                <div className="text-gray-300 text-sm">
                  Use seed to create Ed25519 keypair compatible with Solana
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center">
                <span className="text-[#17ff9a] font-bold text-sm">3</span>
              </div>
              <div>
                <div className="font-mono text-sm text-[#17ff9a] mb-1">Derive Address</div>
                <div className="text-gray-300 text-sm">
                  Convert public key to Base58-encoded Solana address
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-6 mb-8 overflow-x-auto">
          <pre className="text-sm text-gray-300 font-mono">
{`// Wallet derivation implementation
import { sha256 } from '@noble/hashes/sha256';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

function deriveWalletFromZKSecret(zkSecretKey: string) {
  // Hash the ZK secret to create wallet seed
  const seed = sha256(Buffer.from(zkSecretKey, 'hex'));

  // Generate Solana-compatible Ed25519 keypair
  const keypair = nacl.sign.keyPair.fromSeed(seed.slice(0, 32));

  // Encode public key as Solana address
  const publicKey = bs58.encode(keypair.publicKey);
  const secretKey = bs58.encode(keypair.secretKey);

  return { publicKey, secretKey };
}`}
          </pre>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Transaction Management</h2>

        <div className="space-y-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-3">Transaction Structure</h3>
            <p className="text-gray-300 mb-4">
              Solana transactions consist of one or more instructions, each targeting a specific
              program. ZKForge transactions include metadata for tracking and display purposes.
            </p>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`interface Transaction {
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
}`}
              </pre>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-3">Transaction Signing</h3>
            <p className="text-gray-300 mb-4">
              All transactions are signed client-side using the derived Solana keypair. The signature
              proves authorization without exposing the private key.
            </p>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`const transaction = new Transaction();
transaction.add(
  SystemProgram.transfer({
    fromPubkey: fromPublicKey,
    toPubkey: toPublicKey,
    lamports: amount * LAMPORTS_PER_SOL
  })
);

// Sign with derived keypair
transaction.sign(keypair);

// Submit to network
const signature = await connection.sendTransaction(transaction);`}
              </pre>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-3">Balance Tracking</h3>
            <p className="text-gray-300 mb-4">
              User balances are calculated from transaction history stored in Supabase. Welcome bonus
              of 500 USDC is automatically credited on account creation.
            </p>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`// Calculate balance from transactions
const transactions = await supabase
  .from('transactions')
  .select('*')
  .or(\`from_address.eq.\${address},to_address.eq.\${address}\`)
  .eq('status', 'completed');

const balance = transactions.reduce((sum, tx) => {
  return tx.to_address === address
    ? sum + tx.amount
    : sum - tx.amount;
}, 0);`}
              </pre>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">SPL Token Support</h2>
        <p className="text-gray-300 mb-4">
          ZKForge uses the SPL (Solana Program Library) token standard for USDC and other assets.
          SPL tokens provide:
        </p>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-8">
          <ul className="text-gray-300 space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <span><strong className="text-white">Standardization:</strong> Common interface for all
              fungible tokens on Solana</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <span><strong className="text-white">Efficiency:</strong> Optimized for low gas costs
              and high throughput</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <span><strong className="text-white">Composability:</strong> Compatible with all Solana
              DeFi protocols</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <span><strong className="text-white">Security:</strong> Audited implementation with
              proven track record</span>
            </li>
          </ul>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Network Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-white mb-3">Mainnet</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-gray-300 font-mono">mainnet-beta</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">RPC:</span>
                <span className="text-gray-300 font-mono text-xs">https://api.mainnet-beta.solana.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chain ID:</span>
                <span className="text-gray-300 font-mono">1</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-white mb-3">Devnet</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-gray-300 font-mono">devnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">RPC:</span>
                <span className="text-gray-300 font-mono text-xs">https://api.devnet.solana.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chain ID:</span>
                <span className="text-gray-300 font-mono">103</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-[#17ff9a]/10 to-transparent border border-[#17ff9a]/20">
          <h3 className="text-xl font-bold text-[#17ff9a] mb-2">Next: Smart Contracts</h3>
          <p className="text-gray-300">
            Learn about the on-chain programs that power ZKForge's decentralized features.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
