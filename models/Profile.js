import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // equals id
  username: { type: String, unique: true, sparse: true },
  zk_public_key: { type: String, unique: true, sparse: true },
  solana_address: { type: String },
  is_online: { type: Boolean, default: false },
  profile_picture_url: { type: String, default: null },
  last_seen: { type: Date },
  last_challenge_nonce: { type: String },
  last_challenge_time: { type: Date },
  message_counter: { type: Number, default: 0 }, // for zk-STARK +1 proofs
  created_at: { type: Date, default: Date.now }
}, { versionKey: false, _id: false });

export default mongoose.model('Profile', ProfileSchema);
