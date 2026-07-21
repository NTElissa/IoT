import api, { unwrap } from './api.js';

export const getTasks = (params) => unwrap(api.get('/tasks', { params }));
export const createTask = (payload) => unwrap(api.post('/tasks', payload));
export const updateTaskStatus = (id, payload) => unwrap(api.put(`/tasks/${id}`, payload));
export const completeTask = (id, notes) => unwrap(api.patch(`/tasks/${id}/complete`, { notes }));
export const escalateTask = (id) => unwrap(api.patch(`/tasks/${id}/escalate`));

export default { getTasks, createTask, updateTaskStatus, completeTask, escalateTask };
