import jwt from 'jsonwebtoken';
import env from '../config/env.js';

// Full access token - what every authenticated request uses.
export const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, hospital: user.hospital ? user.hospital.toString() : null, purpose: 'access' },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

// Short-lived token issued after a correct password/passkey/Google check
// when the account has 2FA enabled - proves "who you are" but is not a
// valid access token by itself. Must be exchanged at /auth/2fa/verify-login
// along with a valid TOTP code within 5 minutes.
export const generatePendingTwoFactorToken = (user) =>
  jwt.sign({ id: user._id, purpose: '2fa-pending' }, env.jwtSecret, { expiresIn: '5m' });

export default generateToken;
