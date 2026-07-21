import api, { unwrap } from './api.js';

export const getUsers = (params) => unwrap(api.get('/users', { params }));
export const createUser = (payload) => unwrap(api.post('/users', payload));
export const updateUser = (id, payload) => unwrap(api.put(`/users/${id}`, payload));
export const deleteUser = (id) => unwrap(api.delete(`/users/${id}`));
export const resetPassword = (id, password) => unwrap(api.patch(`/users/${id}/reset-password`, { password }));

export default { getUsers, createUser, updateUser, deleteUser, resetPassword };
