import { Keypair } from '@solana/web3.js';
import crypto from 'crypto';

export function deriveWalletFromZKSecret(secret) {
  const seed = crypto.createHash('sha256').update(secret).digest();
  const kp = Keypair.fromSeed(seed.subarray(0, 32));
  return {
    publicKey: kp.publicKey.toBase58(),
    secretKey: Buffer.from(kp.secretKey).toString('base64')
  };
}
