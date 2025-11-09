// models/Message.js
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  _id:            { type: String, required: true },
  conversation_id:{ type: String, index: true, required: true },
  sender_id:      { type: String, index: true, required: true },

  // encrypted payload (no plaintext on server)
  ciphertext_b58: { type: String, required: true }, // base58(secretbox(ciphertext))
  nonce_b58:      { type: String, required: true }, // base58(24B nonce)
  sig_b58:        { type: String },                  // optional Ed25519 signature over (nonce||ciphertext)

  is_deleted:     { type: Boolean, default: false },
  created_at:     { type: Date, default: Date.now }
}, { versionKey:false, _id:false });

MessageSchema.index({ conversation_id:1, created_at:-1 });

export default mongoose.model('Message', MessageSchema);
