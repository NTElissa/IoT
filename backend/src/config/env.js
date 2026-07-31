export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_iv_monitoring',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  lowThreshold: Number(process.env.LOW_FLUID_THRESHOLD || 10),
  warningThreshold: Number(process.env.WARNING_FLUID_THRESHOLD || 20),
  highThreshold: Number(process.env.HIGH_FLUID_THRESHOLD || 90),
  escalationMinutes: Number(process.env.ESCALATION_MINUTES || 10),
  simulationTickMs: Number(process.env.SIMULATION_TICK_MS || 8000),

  // Africa's Talking SMS gateway (optional - simulated/logged if unset)
  atUsername: process.env.AT_USERNAME || '',
  atApiKey: process.env.AT_API_KEY || '',
  atSenderId: process.env.AT_SENDER_ID || '',
  atSandbox: (process.env.AT_SANDBOX ?? 'true') !== 'false',

  // WebAuthn (fingerprint / passkey login). rpID must match the domain the
  // frontend is served from with no scheme/port (e.g. "localhost" in dev,
  // "dripwatch.example.com" in production) - the browser enforces this.
  rpId: process.env.WEBAUTHN_RP_ID || 'localhost',
  rpName: process.env.WEBAUTHN_RP_NAME || 'DripWatch',
  webauthnOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173',

  // Google Sign-In (verifies a Google ID token against this OAuth client id)
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',

  // Login security
  maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS || 5),
  lockMinutes: Number(process.env.LOCK_MINUTES || 15),
};

export default env;
