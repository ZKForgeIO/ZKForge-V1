// signup-login-stark.mjs
import { instantiateScript } from '@guildofweavers/genstark';
import { Keypair } from '@solana/web3.js';
import { randomBytes, createHash } from 'crypto';

// === parameters ===
const TOTAL_STEPS = 16;                  // must be a power of 2
const TRANSITIONS = TOTAL_STEPS - 1;     // = 15 (so total = 1 init + 15 = 16)
const C = 7n;                            // round constant
const P = 2n ** 32n - 3n * 2n ** 25n + 1n; // field prime used by the AIR

// === helpers ===
const toHex = (u8) => Buffer.from(u8).toString('hex');
const fromHex = (hex) => Buffer.from(hex, 'hex');
const bytesToBigIntMod = (u8) => (BigInt('0x' + toHex(u8)) % P);

// toy MiMC-like permutation: r <- r^3 + C (mod P), run TRANSITIONS times
function toyMiMC(x) {
  let r = x % P;
  for (let i = 0; i < TRANSITIONS; i++) {
    r = (r * r % P * r % P + C) % P;
  }
  return r;
}

function proofFingerprint(proof) {
  const json = JSON.stringify(proof, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
  return createHash('sha256').update(Buffer.from(json)).digest('hex');
}

// === AIR: prove “I know x such that after TRANSITIONS rounds we get h (via boundary)” ===
const AIR = Buffer.from(`
define Login over prime field (2^32 - 3 * 2^25 + 1) {

    secret input x: element[1];

    transition 1 register {
        for each (x) {
            init { yield x; }
            for steps [1..${TRANSITIONS}] { yield $r0 * $r0 * $r0 + ${C.toString()}; }
        }
    }

    enforce 1 constraint {
        for all steps { enforce transition($r) = $n; }
    }
}
`);

// === in-memory registry: username -> { commitment, address } ===
const registry = new Map();

// ---------- SIGNUP ----------
console.log('--- SIGNUP ---');
const username = 'alice';

// If you want to reproduce your failing case exactly, uncomment and paste your secret:
// const secret = fromHex('ffce9ce3c64ecd31520cfa81b2a99643e2e3c084cd423c6a3d7b3002599a86a5');
const secret = randomBytes(32);

const x = bytesToBigIntMod(secret);
const commitment = toyMiMC(x);
const keypair = Keypair.fromSeed(secret);
const address = keypair.publicKey.toBase58();

registry.set(username, { commitment: commitment.toString(), address });

console.log('username:', username);
console.log('give user secret (hex):', toHex(secret));     // hand this to the user
console.log('public commitment h (decimal):', commitment.toString());
console.log('solana address:', address);

// ---------- LOGIN (user enters secret) ----------
console.log('\n--- LOGIN ---');
const enteredSecretHex = toHex(secret); // simulate correct entry
const entered = fromHex(enteredSecretHex);
const x2 = bytesToBigIntMod(entered);

const { commitment: hStr } = registry.get(username);
const h = BigInt(hStr);

// Build prover and final boundary assertion: step = TRANSITIONS (i.e., 15) equals h
const stark = instantiateScript(AIR);
const assertions = [{ register: 0, step: TRANSITIONS, value: h }];

const proof = stark.prove(assertions, [[x2]]);
const ok = stark.verify(assertions, proof);

console.log('STARK verified?', ok);
console.log('proofKey:', proofFingerprint(proof));
console.log(ok ? `Login success for ${username} ✅` : `Login failed for ${username} ❌`);

if (ok) {
  const kp = Keypair.fromSeed(entered);
  console.log('solana address (login-side):', kp.publicKey.toBase58());
}
