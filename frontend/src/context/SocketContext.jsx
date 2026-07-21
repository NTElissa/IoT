import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const listenersRef = useRef({ ivUpdate: new Set(), taskUpdate: new Set(), alert: new Set() });

  useEffect(() => {
    const token = localStorage.getItem('iv_token');
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('notification', (payload) => {
      setNotifications((prev) => [{ id: Date.now() + Math.random(), ...payload }, ...prev].slice(0, 20));
    });

    socket.on('iv-update', (payload) => {
      listenersRef.current.ivUpdate.forEach((cb) => cb(payload));
    });

    socket.on('task-update', (payload) => {
      listenersRef.current.taskUpdate.forEach((cb) => cb(payload));
    });

    socket.on('alert', (payload) => {
      listenersRef.current.alert.forEach((cb) => cb(payload));
      setNotifications((prev) =>
        [{ id: Date.now() + Math.random(), channel: 'alert', ...payload }, ...prev].slice(0, 20)
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  const subscribe = useMemo(
    () => ({
      onIVUpdate: (cb) => {
        listenersRef.current.ivUpdate.add(cb);
        return () => listenersRef.current.ivUpdate.delete(cb);
      },
      onTaskUpdate: (cb) => {
        listenersRef.current.taskUpdate.add(cb);
        return () => listenersRef.current.taskUpdate.delete(cb);
      },
      onAlert: (cb) => {
        listenersRef.current.alert.add(cb);
        return () => listenersRef.current.alert.delete(cb);
      },
    }),
    []
  );

  const dismissNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  return (
    <SocketContext.Provider value={{ connected, notifications, dismissNotification, ...subscribe }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};

export default SocketContext;
