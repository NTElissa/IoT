import api, { unwrap } from './api.js';

export const getVitals = (patientId) => unwrap(api.get(`/patients/${patientId}/vitals`));
export const createVital = (patientId, payload) => unwrap(api.post(`/patients/${patientId}/vitals`, payload));

export default { getVitals, createVital };
