// models/ApiKey.js
import mongoose from 'mongoose';

const ApiKeySchema = new mongoose.Schema({
  user_id: { type: String, index: true, required: true },
  key_id: { type: String, unique: true, index: true, required: true },   // public API key
  secret_hash: { type: String, required: true },                          // hashed secret
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  last_used_at: { type: Date }
}, { versionKey: false });

export default mongoose.model('ApiKey', ApiKeySchema);
