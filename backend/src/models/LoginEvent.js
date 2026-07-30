import mongoose from 'mongoose';

// Security audit log - one row per login attempt (successful or not), for
// every authentication method. Hospital admins can review their own
// hospital's history; a Super Admin can review platform-wide activity.
// This is exactly the kind of record a real hospital's compliance/security
// review would expect to exist.
const loginEventSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, trim: true },
    success: { type: Boolean, required: true },
    method: {
      type: String,
      enum: ['password', 'webauthn', 'google', '2fa'],
      required: true,
    },
    reason: { type: String, trim: true }, // e.g. "invalid_password", "account_locked"
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { timestamps: true }
);

loginEventSchema.index({ hospital: 1, createdAt: -1 });

export default mongoose.model('LoginEvent', loginEventSchema);
