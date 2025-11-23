# 🔐 ZK-Chat — Zero-Knowledge Encrypted Messaging Platform

ZK-Chat is a next-generation, privacy-first messaging ecosystem built with **end-to-end encryption**, **zero-knowledge authentication**, and **non-custodial identity**. Every message, user session, and wallet interaction is cryptographically verified — **without ever storing or transmitting private keys**.

---

## 🚀 Core Features

### 🧠 Zero-Knowledge Authentication (ZKAuth)
- Users sign up and log in using a locally generated **Ed25519 keypair**.
- Authentication uses **zero-knowledge proofs (ZK-STARK-compatible)** — proving identity ownership **without revealing the secret key**.
- The backend never sees or stores private keys — only the derived **public key** and **Solana address**.
- Session tokens now use **short-lived access tokens** with **refresh token support**.

### 🔐 End-to-End Chat Encryption
- Every conversation and lounge message is **encrypted with per-room symmetric keys** (`nacl.secretbox` AES-grade security).
- Keys are sealed and exchanged using ephemeral **Curve25519** boxes, derived from each user’s Ed25519 keypair.
- Messages are signed with `nacl.sign.detached` for sender authenticity.
- Even the server cannot decrypt messages — all encryption/decryption happens **client-side**.

### 💬 Global Lounge (Public Encrypted Room)
- Public discussion room with encrypted message broadcast using a temporary shared key.
- Messages self-destruct after defined time windows.
- Rate-limit and anti-spam protections enforced **with server-side verification and session tracking**.

### 💼 Wallet Integration (Non-Custodial)
- Each user automatically derives a **Solana wallet** from their zero-knowledge secret.
- Wallet private keys are generated and stored **only on the client** — never transmitted or saved on the backend.
- Supports in-app USDC transactions, signed locally with the user’s keypair.
- Transaction hashes are generated using **secure SHA-256 cryptographic hash functions**.

### 🌐 WebSocket-Based Real-Time Updates
- Secure WebSocket channel for live message delivery, typing indicators, and presence tracking.
- Each message includes cryptographic nonce, ciphertext, and signature validation before render.

---

## 🔒 Security Enhancements (v1.1.0)

- ✅ **Session Revocation**: Tokens can be invalidated on logout or compromise.
- ✅ **Session Cleanup**: Expired sessions are removed from MongoDB via TTL index.
- ✅ **Access/Refresh Token Flow**: Users get short-lived access tokens and long-lived refresh tokens.
- ✅ **Rate Limiting**: API-wide and endpoint-specific rate limits enforced via `express-rate-limit`.
- ✅ **Path Traversal Protection**: Uploaded file extensions are validated and sanitized.
- ✅ **Strict CORS Policy**: Only trusted frontend origins allowed.
- ✅ **Signature Verification**: Lounge messages must include valid Ed25519 signatures.

---

## 🧱 Architecture Overview

| Layer | Description |
|-------|--------------|
| **Frontend (React + Tailwind)** | Handles encryption, proof generation, local key storage, and message rendering. |
| **Backend (Express + MongoDB)** | Stateless API for user sessions, rate limits, and message metadata. |
| **Crypto Layer (`tweetnacl`, `ed2curve`, `bs58`)** | Provides all signing, sealing, and encryption primitives. |
| **Database (MongoDB)** | Stores encrypted blobs (ciphertext + nonce + signature) and public keys only. |
| **Realtime (WebSocket)** | Delivers encrypted payloads instantly to authorized peers. |

---

## 🧩 Key Design Principles

1. **Zero Storage of Private Keys**  
   - All signing keys and secrets exist *only* in the user’s local storage.  
   - Backend never receives or logs private data.

2. **Provable Authentication**  
   - Login requests include cryptographic proofs generated from a local secret key.  
   - The backend verifies proofs without learning or reconstructing secrets.

3. **Encrypted-At-Rest and In-Transit**  
   - Every message is AES-grade encrypted before leaving the device.  
   - Database entries and WebSocket messages are opaque ciphertexts.

4. **Verifiable Sender Identity**  
   - Every message includes a detached Ed25519 signature verifying authorship.  
   - Any tampering or impersonation fails verification client-side.

---

## ⚙️ Tech Stack

| Category | Libraries / Tools |
|-----------|-------------------|
| Frontend | React, TailwindCSS, TypeScript, Vite |
| Backend | Node.js (Express), MongoDB |
| Cryptography | TweetNaCl, ed2curve, bs58, genSTARK |
| Blockchain | Solana Web3.js |
| Real-Time | WebSockets |
| Security | Rate Limiters, CORS, JWT Access + Refresh Tokens, Signature Verification |
