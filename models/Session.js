import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
  {
    // Store a derived value (e.g., SHA-256 hash of the raw token)
    _id: { type: String, required: true },

    user_id: { type: String, required: true, index: true },

    // Security monitoring / session tracking fields
    ip_address: { type: String },
    user_agent: { type: String },
    created_at: { type: Date, default: Date.now },
    last_activity: { type: Date, default: Date.now },

    expires_at: { type: Date, required: true },
    revoked: { type: Boolean, default: false }
  },
  { versionKey: false }
);

// TTL index for automatic session cleanup
SessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', SessionSchema);
