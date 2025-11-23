import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },

    username: { type: String, unique: true, sparse: true },

    /**
     * -------------------------------------
     * 🔐 NEW FIELDS FOR MODERN AUTH SYSTEM
     * -------------------------------------
     */

    // ✔ Lounge encryption (Ed25519 pubkey, base58)
    ed25519_public_key: {
      type: String,
      default: null,
      index: true
    },

    // ✔ zkSTARK public commitment (final hash hex)
    zk_public_key: {
      type: String,
      unique: true,
      sparse: true
    },

    // ✔ Per-user zkSTARK parameters (optional override)
    zk_auth_steps: { type: Number, default: null },
    zk_auth_queries: { type: Number, default: null },

    /**
     * -------------------------------------
     * Existing properties (kept)
     * -------------------------------------
     */

    solana_address: { type: String },

    is_online: { type: Boolean, default: false },

    profile_picture_url: { type: String, default: null },

    last_seen: { type: Date },

    last_challenge_nonce: { type: String },
    last_challenge_time: { type: Date },

    message_counter: { type: Number, default: 0 },

    created_at: { type: Date, default: Date.now }
  },
  {
    versionKey: false,
    _id: false
  }
);

export default mongoose.model('Profile', ProfileSchema);
