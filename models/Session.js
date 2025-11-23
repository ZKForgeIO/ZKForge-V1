import mongoose from 'mongoose';
const SessionSchema = new mongoose.Schema({
    _id: String,
  token: { type: String, unique: true },
  user_id: mongoose.Types.ObjectId,
  expires_at: Date,
  revoked: { type: Boolean, default: false }
}, { versionKey: false });
SessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', SessionSchema);
