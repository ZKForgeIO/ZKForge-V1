import mongoose from 'mongoose';
const ConversationParticipantSchema = new mongoose.Schema({
  conversation_id: { type: String, index: true },
  user_id: { type: String, index: true }
}, { versionKey:false });
ConversationParticipantSchema.index({ conversation_id:1, user_id:1 }, { unique:true });
export default mongoose.model('ConversationParticipant', ConversationParticipantSchema);
