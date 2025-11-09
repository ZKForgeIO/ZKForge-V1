import mongoose from 'mongoose';
const SessionSchema = new mongoose.Schema({
  token: { type: String, unique: true },
  user_id: { type: String, index: true },
  expires_at: { type: Date, index: true },
}, { versionKey: false });
export default mongoose.model('Session', SessionSchema);
