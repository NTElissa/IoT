export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/smart_iv_monitoring',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  lowThreshold: Number(process.env.LOW_FLUID_THRESHOLD || 10),
  warningThreshold: Number(process.env.WARNING_FLUID_THRESHOLD || 20),
  highThreshold: Number(process.env.HIGH_FLUID_THRESHOLD || 90),
  escalationMinutes: Number(process.env.ESCALATION_MINUTES || 10),
  simulationTickMs: Number(process.env.SIMULATION_TICK_MS || 8000),
};

export default env;
