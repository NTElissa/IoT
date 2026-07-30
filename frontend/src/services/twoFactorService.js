import api, { unwrap } from './api.js';

export const setupTwoFactor = () => unwrap(api.post('/auth/2fa/setup'));
export const confirmTwoFactor = (code) => unwrap(api.post('/auth/2fa/confirm', { code }));
export const disableTwoFactor = (password) => unwrap(api.post('/auth/2fa/disable', { password }));
export const verifyLoginTwoFactor = (tempToken, code) =>
  unwrap(api.post('/auth/2fa/verify-login', { tempToken, code }));

export default { setupTwoFactor, confirmTwoFactor, disableTwoFactor, verifyLoginTwoFactor };
