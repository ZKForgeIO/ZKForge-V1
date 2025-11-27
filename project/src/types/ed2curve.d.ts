declare module 'ed2curve' {
    import * as nacl from 'tweetnacl';
    export function convertSecretKey(secretKey: Uint8Array): Uint8Array | null;
    export function convertPublicKey(publicKey: Uint8Array): Uint8Array | null;
    export function convertKeyPair(keyPair: nacl.SignKeyPair): nacl.BoxKeyPair | null;
}
