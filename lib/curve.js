// lib/curve.js
import nacl from 'tweetnacl';
import ed2curve from 'ed2curve';

// Convert Ed25519 public key (32B) to Curve25519 public key (for nacl.box)
export function edPubToCurve25519(edPub32) {
  const curve = ed2curve.convertPublicKey(edPub32);
  if (!curve) throw new Error('Failed to convert Ed25519 pub -> Curve25519 pub');
  return curve;
}

// Convert Ed25519 64B secret (expanded) to Curve25519 32B secret key
export function edSecretToCurve25519(edSecret64) {
  // The last 32 bytes in tweetnacl.sign secretKey are the seed? No—tweetnacl stores [secret(64)].
  // ed2curve needs Ed25519 *private key* (64B) to produce Curve25519 32B sk.
  const curve = ed2curve.convertSecretKey(edSecret64);
  if (!curve) throw new Error('Failed to convert Ed25519 secret -> Curve25519 secret');
  return curve;
}
