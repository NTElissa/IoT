import api, { unwrap } from './api.js';

export const getLoginEvents = () => unwrap(api.get('/security/login-events'));

export default { getLoginEvents };
