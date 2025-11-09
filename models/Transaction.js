import mongoose from 'mongoose';
const TransactionSchema = new mongoose.Schema({
  user_id: { type: String, index: true },
  type: { type: String, enum: ['receive','send'] },
  amount: { type: Number },
  currency: { type: String },
  from_address: { type: String },
  to_address: { type: String },
  status: { type: String, enum: ['pending','completed','failed'], default:'completed' },
  description: { type: String },
  transaction_hash: { type: String },
  created_at: { type: Date, default: Date.now }
}, { versionKey:false });
export default mongoose.model('Transaction', TransactionSchema);
