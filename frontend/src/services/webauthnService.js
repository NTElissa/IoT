import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import api, { unwrap } from './api.js';

// Registering a new passkey for the currently signed-in user.
export const registerPasskey = async (deviceName) => {
  const options = await unwrap(api.get('/auth/webauthn/register-options'));
  const credential = await startRegistration(options);
  return unwrap(api.post('/auth/webauthn/register-verify', { credential, deviceName }));
};

export const listPasskeys = () => unwrap(api.get('/auth/webauthn/credentials'));
export const removePasskey = (credentialId) => unwrap(api.delete(`/auth/webauthn/credentials/${credentialId}`));

// Signing in with an existing passkey - no password involved.
export const loginWithPasskey = async (email) => {
  const options = await unwrap(api.post('/auth/webauthn/login-options', { email }));
  const credential = await startAuthentication(options);
  return unwrap(api.post('/auth/webauthn/login-verify', { email, credential }));
};

export default { registerPasskey, listPasskeys, removePasskey, loginWithPasskey };
