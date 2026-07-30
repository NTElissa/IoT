import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import 'express-async-errors';
import env from './config/env.js';

import authRoutes from './routes/authRoutes.js';
import webauthnRoutes from './routes/webauthnRoutes.js';
import twoFactorRoutes from './routes/twoFactorRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import userRoutes from './routes/userRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import ivFluidRoutes from './routes/ivFluidRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import securityRoutes from './routes/securityRoutes.js';

import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Sets a battery of protective HTTP headers (HSTS, no-sniff, frame-ancestors,
// etc). Disabled CSP's default directives here since this API serves JSON
// only (no HTML), and a strict default-src can otherwise interfere with
// some deployment setups reverse-proxying this alongside the frontend.
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Smart IV Monitoring API is running', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth/webauthn', webauthnRoutes);
app.use('/api/v1/auth/2fa', twoFactorRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/iv-fluids', ivFluidRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/security', securityRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
