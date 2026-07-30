import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '../services/authService.js';
import * as webauthnService from '../services/webauthnService.js';
import * as twoFactorService from '../services/twoFactorService.js';

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

  const applyAuthResult = useCallback((result) => {
    // Accounts with 2FA enabled get a pending token instead of a full one -
    // the caller (LoginPage) is responsible for prompting for the code and
    // calling completeTwoFactor with it.
    if (result.requiresTwoFactor) return result;
    localStorage.setItem('iv_token', result.token);
    localStorage.setItem('iv_user', JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }, []);

  const login = useCallback(
    async (email, password) => applyAuthResult(await authService.login(email, password)),
    [applyAuthResult]
  );

  const loginWithGoogle = useCallback(
    async (idToken) => applyAuthResult(await authService.loginWithGoogle(idToken)),
    [applyAuthResult]
  );

  const loginWithPasskey = useCallback(
    async (email) => applyAuthResult(await webauthnService.loginWithPasskey(email)),
    [applyAuthResult]
  );

  const completeTwoFactor = useCallback(
    async (tempToken, code) => applyAuthResult(await twoFactorService.verifyLoginTwoFactor(tempToken, code)),
    [applyAuthResult]
  );

  const registerSuperAdmin = useCallback(async (payload) => {
    const { user: newUser, token } = await authService.registerSuperAdmin(payload);
    localStorage.setItem('iv_token', token);
    localStorage.setItem('iv_user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }, []);

  const refreshUser = useCallback(async () => {
    const { user: fresh } = await authService.getMe();
    setUser(fresh);
    localStorage.setItem('iv_user', JSON.stringify(fresh));
    return fresh;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('iv_token');
    localStorage.removeItem('iv_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        loginWithPasskey,
        completeTwoFactor,
        registerSuperAdmin,
        refreshUser,
        logout,
      }}
    >
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
