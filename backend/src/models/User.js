import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const webauthnCredentialSchema = new mongoose.Schema(
  {
    credentialId: { type: String, required: true }, // base64url
    publicKey: { type: String, required: true }, // base64
    counter: { type: Number, required: true, default: 0 },
    deviceName: { type: String, trim: true, default: 'Passkey' },
    transports: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'doctor', 'nurse', 'staff', 'patient'],
      required: true,
      default: 'nurse',
    },
    // Only set for role: 'patient' - links their portal login back to
    // their clinical record.
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
    // Every role except super_admin belongs to exactly one hospital.
    // super_admin has hospital: null and operates above all hospitals.
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    phone: { type: String, trim: true },
    ward: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Google Sign-In - links to an existing account by email; never used
    // to create a new one.
    googleId: { type: String, default: null },

    // WebAuthn (fingerprint / passkey) credentials registered for this
    // account, and the in-flight challenge for whichever ceremony
    // (registration or authentication) is currently open.
    webauthnCredentials: [webauthnCredentialSchema],
    currentChallenge: { type: String, select: false },

    // TOTP two-factor authentication
    twoFactorSecret: { type: String, select: false },
    twoFactorEnabled: { type: Boolean, default: false },

    // Brute-force protection
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function isLocked() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.currentChallenge;
  delete obj.twoFactorSecret;
  // Credential public keys aren't secret, but there's no reason to ship
  // them to the client either - only what the Security page needs.
  obj.webauthnCredentials = (obj.webauthnCredentials || []).map((c) => ({
    _id: c._id,
    deviceName: c.deviceName,
    createdAt: c.createdAt,
  }));
  return obj;
};

export default mongoose.model('User', userSchema);
