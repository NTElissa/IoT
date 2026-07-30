import api, { unwrap } from './api.js';

export const login = (email, password) => unwrap(api.post('/auth/login', { email, password }));
export const loginWithGoogle = (idToken) => unwrap(api.post('/auth/google', { idToken }));
export const registerSuperAdmin = (payload) => unwrap(api.post('/auth/register', payload));
export const getMe = () => unwrap(api.get('/auth/me'));

export default { login, loginWithGoogle, registerSuperAdmin, getMe };
