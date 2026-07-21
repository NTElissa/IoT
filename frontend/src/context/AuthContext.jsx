import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('iv_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('iv_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then(({ user: fresh }) => {
        setUser(fresh);
        localStorage.setItem('iv_user', JSON.stringify(fresh));
      })
      .catch(() => {
        localStorage.removeItem('iv_token');
        localStorage.removeItem('iv_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: loggedInUser, token } = await authService.login(email, password);
    localStorage.setItem('iv_token', token);
    localStorage.setItem('iv_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const registerFirstAdmin = useCallback(async (payload) => {
    const { user: newUser, token } = await authService.registerFirstAdmin(payload);
    localStorage.setItem('iv_token', token);
    localStorage.setItem('iv_user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('iv_token');
    localStorage.removeItem('iv_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerFirstAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
