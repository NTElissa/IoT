import api, { unwrap } from './api.js';

export const getPatients = () => unwrap(api.get('/patients'));
export const getPatient = (id) => unwrap(api.get(`/patients/${id}`));
export const getPatientHistory = (id) => unwrap(api.get(`/patients/${id}/history`));
export const getPatientNotes = (id) => unwrap(api.get(`/patients/${id}/notes`));
export const createPatientNote = (id, payload) => unwrap(api.post(`/patients/${id}/notes`, payload));
export const createPatient = (payload) => unwrap(api.post('/patients', payload));
export const updatePatient = (id, payload) => unwrap(api.put(`/patients/${id}`, payload));
export const deletePatient = (id) => unwrap(api.delete(`/patients/${id}`));
export const enablePortalAccess = (id, password) => unwrap(api.post(`/patients/${id}/portal-access`, { password }));
export const disablePortalAccess = (id) => unwrap(api.delete(`/patients/${id}/portal-access`));

export default {
  getPatients,
  getPatient,
  getPatientHistory,
  getPatientNotes,
  createPatientNote,
  createPatient,
  updatePatient,
  deletePatient,
  enablePortalAccess,
  disablePortalAccess,
};
