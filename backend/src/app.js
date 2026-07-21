import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'express-async-errors';
import env from './config/env.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import ivFluidRoutes from './routes/ivFluidRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Smart IV Monitoring API is running', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/iv-fluids', ivFluidRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
