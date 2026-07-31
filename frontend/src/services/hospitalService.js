import api, { unwrap } from './api.js';

export const getHospitals = () => unwrap(api.get('/hospitals'));
export const getHospital = (id) => unwrap(api.get(`/hospitals/${id}`));
export const createHospital = (payload) => unwrap(api.post('/hospitals', payload));
export const updateHospital = (id, payload) => unwrap(api.put(`/hospitals/${id}`, payload));
export const deleteHospital = (id, confirmName) =>
  unwrap(api.delete(`/hospitals/${id}`, { data: { confirmName } }));

export default { getHospitals, getHospital, createHospital, updateHospital, deleteHospital };
