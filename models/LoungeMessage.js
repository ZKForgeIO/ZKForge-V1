// models/LoungeMessage.js
import mongoose from 'mongoose';

const LoungeMessageSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sender_id: { type: String, required: true, index: true },
  ciphertext_b58: { type: String, required: true },
  nonce_b58: { type: String, required: true },
  sig_b58: { type: String, required: false },
  key_version: { type: Number, default: 1 }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('LoungeMessage', LoungeMessageSchema);
