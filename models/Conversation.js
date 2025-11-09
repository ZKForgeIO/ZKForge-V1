import mongoose from 'mongoose';
const ConversationSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, default: null },
  is_group: { type: Boolean, default: false },
  updated_at: { type: Date, default: Date.now }
}, { versionKey:false, _id:false });
export default mongoose.model('Conversation', ConversationSchema);
