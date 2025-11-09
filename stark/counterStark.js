import { instantiateScript } from '@guildofweavers/genstark';

// Keep constants inside AirScript; we'll still pass BigInts in JS.
const air = Buffer.from(`
define Counter over prime field (2^32 - 3 * 2^25 + 1) {
  secret input start: element[1];

  transition 1 register {
    for each (start) {
      init { yield start; }
      // exactly 1 step -> trace of length 2 (prev -> next)
      for steps [1..1] { yield $r0 + 1; }
    }
  }

  enforce 1 constraint {
    for all steps { enforce transition($r) = $n; }
  }
}
`);

let _stark;

/**
 * Instantiate with parameters that keep everything in BigInt land.
 * - wasm: false (avoid partial wasm paths)
 * - hashAlgorithm: blake2s256 (fewer surprises than sha256 path here)
 */
export function getCounterStark() {
  if (!_stark) {
    _stark = instantiateScript(air, {
      wasm: false,
      hashAlgorithm: 'blake2s256',
      // keep defaults for query counts etc., no need to touch
    });
  }
  return _stark;
}

/**
 * Prove that next = prev + 1 (mod field)
 * All inputs and assertion values are explicit BigInt.
 */
export function proveIncrement(prev, next) {
  // Normalize everything to BigInt up front
  const P = toBI(prev);
  const N = toBI(next);

  // Assertions must be BigInt for values
  const assertions = [
    { register: 0, step: 0, value: P },
    { register: 0, step: 1, value: N }
  ];

  // AirScript "secret input start: element[1]" -> inputs is [[start]]
  const inputs = [[P]];

  const stark = getCounterStark();
  const proof = stark.prove(assertions, inputs);   // all BigInt ✔

  return { assertions, proof, claimedPrev: P, claimedNext: N };
}

/**
 * Verify proof
 */
export function verifyIncrement(assertions, proof) {
  // Assertions may arrive with values revived to BigInt by the route.
  return getCounterStark().verify(assertions, proof);
}

/**
 * Helpers
 */
function toBI(x) {
  if (typeof x === 'bigint') return x;
  if (typeof x === 'number') return BigInt(x);
  if (typeof x === 'string' && /^-?\d+$/.test(x)) return BigInt(x);
  throw new TypeError(`Cannot coerce value to BigInt: ${x}`);
}

export function bigintToString(obj) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
}

export function reviveBigInts(x) {
  if (Array.isArray(x)) return x.map(reviveBigInts);
  if (x && typeof x === 'object') {
    const o = {};
    for (const k of Object.keys(x)) o[k] = reviveBigInts(x[k]);
    return o;
  }
  if (typeof x === 'string' && /^-?\d+$/.test(x)) return BigInt(x);
  return x;
}
