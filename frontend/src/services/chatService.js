import api, { unwrap } from './api.js';

export const getMessages = (patientId) => unwrap(api.get(`/patients/${patientId}/messages`));
export const sendMessage = (patientId, text) => unwrap(api.post(`/patients/${patientId}/messages`, { text }));
export const markMessagesRead = (patientId) => unwrap(api.patch(`/patients/${patientId}/messages/read`));

export default { getMessages, sendMessage, markMessagesRead };
