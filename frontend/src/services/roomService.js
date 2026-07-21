import api, { unwrap } from './api.js';

export const getRooms = () => unwrap(api.get('/rooms'));
export const getRoom = (id) => unwrap(api.get(`/rooms/${id}`));
export const createRoom = (payload) => unwrap(api.post('/rooms', payload));
export const updateRoom = (id, payload) => unwrap(api.put(`/rooms/${id}`, payload));
export const assignStaff = (id, payload) => unwrap(api.patch(`/rooms/${id}/assign-staff`, payload));
export const deleteRoom = (id) => unwrap(api.delete(`/rooms/${id}`));

export default { getRooms, getRoom, createRoom, updateRoom, assignStaff, deleteRoom };
