import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import env from './src/config/env.js';
import initSockets from './src/sockets/index.js';
import { startSimulation } from './src/services/simulationService.js';

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  initSockets(io);
  startSimulation();

  server.listen(env.port, () => {
    console.log(`[server] Smart IV Monitoring API listening on port http://localhost:${env.port} (${env.nodeEnv})`);
  });
};

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
