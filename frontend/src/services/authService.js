import api, { unwrap } from './api.js';

export const login = (email, password) => unwrap(api.post('/auth/login', { email, password }));
export const registerFirstAdmin = (payload) => unwrap(api.post('/auth/register', payload));
export const getMe = () => unwrap(api.get('/auth/me'));

export default { login, registerFirstAdmin, getMe };
