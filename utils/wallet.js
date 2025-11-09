// utils/wallet.js
import { Keypair } from '@solana/web3.js';

export function createSolanaWallet() {
  const kp = Keypair.generate();
  // secretKey is Uint8Array; store securely in real apps
  return {
    publicKey: kp.publicKey.toBase58(),
    secretKey: Buffer.from(kp.secretKey).toString('base64') // demo only
  };
}
