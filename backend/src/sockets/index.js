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

    // Scope events precisely so nothing crosses hospital boundaries:
    // - every authenticated user gets their own room (`user:<id>`) for
    //   directly-targeted notifications
    // - hospital admins additionally join a room scoped to their own
    //   hospital (`hospital-admin:<hospitalId>`) so they see everything
    //   happening in their hospital, but never another hospital's data
    // - super_admin does not join any clinical broadcast room; they manage
    //   hospitals/admins, not day-to-day patient care
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
      if (socket.user.role === 'admin' && socket.user.hospital) {
        socket.join(`hospital-admin:${socket.user.hospital}`);
      }
    }

    socket.on('disconnect', () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });

  attachIO(io);
};

export default initSockets;
