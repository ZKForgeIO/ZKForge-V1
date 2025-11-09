import DocsLayout from '../../components/DocsLayout';

export default function ZKAuth() {
  return (
    <DocsLayout>
      <div className="prose prose-invert max-w-none">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Zero-Knowledge Authentication
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Understanding the cryptographic foundation of ZKForge
        </p>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Overview</h2>
        <p className="text-gray-300 mb-4">
          Zero-Knowledge authentication allows users to prove their identity without revealing
          their secret credentials. This is achieved through cryptographic proofs that demonstrate
          knowledge of a secret without disclosing the secret itself.
        </p>

        {/* Cryptographic Flow Diagram */}
        <div className="my-12 p-8 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#151515] to-[#0f0f0f] border border-[#2a2a2a]">
          <h3 className="text-center text-white font-bold mb-8">Authentication Protocol</h3>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center">
                <span className="text-[#17ff9a] font-bold">1</span>
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm text-[#17ff9a] mb-1">Key Generation</div>
                <div className="text-gray-300 text-sm">Generate Ed25519 keypair (secret, public)</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center">
                <span className="text-[#17ff9a] font-bold">2</span>
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm text-[#17ff9a] mb-1">Challenge Request</div>
                <div className="text-gray-300 text-sm">Server generates random challenge nonce</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center">
                <span className="text-[#17ff9a] font-bold">3</span>
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm text-[#17ff9a] mb-1">Proof Generation</div>
                <div className="text-gray-300 text-sm">Client signs challenge with secret key</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center">
                <span className="text-[#17ff9a] font-bold">4</span>
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm text-[#17ff9a] mb-1">Verification</div>
                <div className="text-gray-300 text-sm">Server verifies signature using public key</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#17ff9a]/10 border border-[#17ff9a]/20 flex items-center justify-center">
                <span className="text-[#17ff9a] font-bold">5</span>
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm text-[#17ff9a] mb-1">Session Token</div>
                <div className="text-gray-300 text-sm">Issue JWT token for authenticated session</div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Key Generation</h2>
        <p className="text-gray-300 mb-4">
          ZKForge uses the Ed25519 signature scheme, which provides:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 mb-6">
          <li>Fast signature generation and verification</li>
          <li>Small key sizes (32 bytes for secret, 32 bytes for public)</li>
          <li>Deterministic signatures (no random number generation required)</li>
          <li>Resistance to timing attacks</li>
          <li>Mathematically proven security</li>
        </ul>

        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-6 mb-8 overflow-x-auto">
          <pre className="text-sm text-gray-300 font-mono">
{`// Key generation example
import nacl from 'tweetnacl';

const keyPair = nacl.sign.keyPair();
const secretKey = keyPair.secretKey; // 64 bytes
const publicKey = keyPair.publicKey; // 32 bytes

// Encode for storage/transmission
const secretKeyHex = Buffer.from(secretKey).toString('hex');
const publicKeyHex = Buffer.from(publicKey).toString('hex');`}
          </pre>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Challenge-Response Protocol</h2>
        <p className="text-gray-300 mb-4">
          The authentication process uses a challenge-response mechanism to prevent replay attacks:
        </p>

        <div className="space-y-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-3">Step 1: Challenge Generation</h3>
            <p className="text-gray-300 mb-3">
              The server generates a unique, unpredictable challenge string (nonce) for each
              authentication attempt. This prevents an attacker from reusing old signatures.
            </p>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`const challenge = crypto.randomUUID() + Date.now();
// Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890-1699876543210"`}
              </pre>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-3">Step 2: Proof Creation</h3>
            <p className="text-gray-300 mb-3">
              The client receives the challenge and signs it using their secret key. The signature
              serves as proof they possess the secret without revealing it.
            </p>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`const messageBytes = new TextEncoder().encode(challenge);
const signature = nacl.sign.detached(messageBytes, secretKey);
const proof = {
  challenge,
  signature: Buffer.from(signature).toString('hex'),
  publicKey: publicKeyHex
};`}
              </pre>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-xl font-bold text-white mb-3">Step 3: Verification</h3>
            <p className="text-gray-300 mb-3">
              The server verifies the signature using the provided public key. If verification
              succeeds, the user is authenticated without the server ever seeing the secret key.
            </p>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono">
{`const signatureBytes = Buffer.from(proof.signature, 'hex');
const messageBytes = new TextEncoder().encode(proof.challenge);
const publicKeyBytes = Buffer.from(proof.publicKey, 'hex');

const isValid = nacl.sign.detached.verify(
  messageBytes,
  signatureBytes,
  publicKeyBytes
);`}
              </pre>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Security Properties</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-[#17ff9a] mb-3">Zero-Knowledge</h3>
            <p className="text-gray-300 text-sm">
              The verifier learns nothing about the secret key from the proof. Even with unlimited
              computational power, the secret cannot be derived from the signature.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-[#17ff9a] mb-3">Soundness</h3>
            <p className="text-gray-300 text-sm">
              An attacker cannot create a valid proof without knowing the secret key. The
              probability of forging a signature is negligible (2^-256).
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-[#17ff9a] mb-3">Completeness</h3>
            <p className="text-gray-300 text-sm">
              A legitimate user with the correct secret key will always produce a valid proof
              that passes verification. No false rejections occur.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <h3 className="text-lg font-bold text-[#17ff9a] mb-3">Non-Interactivity</h3>
            <p className="text-gray-300 text-sm">
              After the initial challenge, the proof can be verified independently without further
              communication with the prover.
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Implementation Details</h2>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Libraries Used</h3>
          <div className="space-y-3 text-gray-300 text-sm">
            <div>
              <strong className="text-white">TweetNaCl:</strong> Cryptographic library implementing
              NaCl (Networking and Cryptography Library) in JavaScript. Provides Ed25519 signatures,
              X25519 key exchange, and ChaCha20-Poly1305 encryption.
            </div>
            <div>
              <strong className="text-white">@noble/hashes:</strong> High-performance cryptographic
              hashing library for SHA-256, BLAKE3, and other hash functions. Used for key derivation
              and data integrity.
            </div>
            <div>
              <strong className="text-white">bs58:</strong> Base58 encoding/decoding for Solana
              addresses and transaction hashes. Provides human-readable representation of binary data.
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mt-12 mb-4">Key Storage</h2>
        <p className="text-gray-300 mb-4">
          Secret keys are stored securely in the browser's localStorage with the following considerations:
        </p>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 mb-8">
          <ul className="text-gray-300 space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <span><strong className="text-white">Encrypted Storage:</strong> Keys are encrypted before
              storage using Web Crypto API</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <span><strong className="text-white">Same-Origin Policy:</strong> localStorage is isolated
              per origin, preventing cross-site access</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <span><strong className="text-white">Session Management:</strong> Keys are cleared on
              logout and can expire automatically</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#17ff9a]">✓</span>
              <span><strong className="text-white">Backup Responsibility:</strong> Users must backup
              their secret key - recovery is impossible without it</span>
            </li>
          </ul>
        </div>

        <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-[#17ff9a]/10 to-transparent border border-[#17ff9a]/20">
          <h3 className="text-xl font-bold text-[#17ff9a] mb-2">Next: Solana Integration</h3>
          <p className="text-gray-300">
            Learn how ZKForge integrates with Solana blockchain for wallet management and transactions.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
