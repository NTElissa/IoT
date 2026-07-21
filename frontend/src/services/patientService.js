import api, { unwrap } from './api.js';

export const getPatients = () => unwrap(api.get('/patients'));
export const getPatient = (id) => unwrap(api.get(`/patients/${id}`));
export const createPatient = (payload) => unwrap(api.post('/patients', payload));
export const updatePatient = (id, payload) => unwrap(api.put(`/patients/${id}`, payload));
export const deletePatient = (id) => unwrap(api.delete(`/patients/${id}`));

export default { getPatients, getPatient, createPatient, updatePatient, deletePatient };
