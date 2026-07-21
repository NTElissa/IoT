import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { attachIO } from '../services/notificationService.js';

export const initSockets = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(); // allow anonymous read-only connections too
      const decoded = jwt.verify(token, env.jwtSecret);
      socket.user = decoded;
    } catch (err) {
      // invalid token - still allow connection but unauthenticated
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  attachIO(io);
};

export default initSockets;
