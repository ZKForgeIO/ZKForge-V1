export class EncryptionService {
    private static readonly SALT_LEN = 16;
    private static readonly IV_LEN = 12;
    private static readonly ITERATIONS = 100000;
    private static readonly ALGO = 'AES-GCM';
    private static readonly HASH = 'SHA-256';

    /**
     * Derives a cryptographic key from a password and salt.
     */
    static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.ITERATIONS,
                hash: this.HASH,
            },
            keyMaterial,
            { name: this.ALGO, length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypts data using a password.
     * Returns base64 encoded string containing salt + iv + ciphertext.
     */
    static async encrypt(data: string, password: string): Promise<string> {
        const salt = window.crypto.getRandomValues(new Uint8Array(this.SALT_LEN));
        const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LEN));

        const key = await this.deriveKey(password, salt);
        const enc = new TextEncoder();

        const encrypted = await window.crypto.subtle.encrypt(
            { name: this.ALGO, iv },
            key,
            enc.encode(data)
        );

        // Combine salt + iv + encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        return this.arrayBufferToBase64(combined);
    }

    /**
     * Decrypts data using a password.
     */
    static async decrypt(encryptedBase64: string, password: string): Promise<string> {
        try {
            const combined = this.base64ToArrayBuffer(encryptedBase64);

            if (combined.byteLength < this.SALT_LEN + this.IV_LEN) {
                throw new Error('Invalid encrypted data length');
            }

            const salt = combined.slice(0, this.SALT_LEN);
            const iv = combined.slice(this.SALT_LEN, this.SALT_LEN + this.IV_LEN);
            const data = combined.slice(this.SALT_LEN + this.IV_LEN);

            const key = await this.deriveKey(password, salt);

            const decrypted = await window.crypto.subtle.decrypt(
                { name: this.ALGO, iv },
                key,
                data
            );

            const dec = new TextDecoder();
            return dec.decode(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data. Incorrect password?');
        }
    }

    private static arrayBufferToBase64(buffer: Uint8Array): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    private static base64ToArrayBuffer(base64: string): Uint8Array {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    }
}
