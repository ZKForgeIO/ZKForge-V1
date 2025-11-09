// node scripts/derivePub.js 0x....
import { derivePublicKeyFromSecret, normalizeTo0xHex } from '../lib/zkAuth.js';

const raw = process.argv[2] || '';
const sk = normalizeTo0xHex(raw);
if (!sk) {
  console.error('Bad key input'); process.exit(1);
}
const pub = derivePublicKeyFromSecret(sk);
console.log('derived pub:', pub);
