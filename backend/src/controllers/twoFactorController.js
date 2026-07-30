import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';
import generateToken from '../utils/generateToken.js';
import { recordLoginEvent } from '../services/loginAudit.js';
import { success, failure } from '../utils/apiResponse.js';

// Step 1: generate a secret and show it as a QR code. Not enabled yet -
// only becomes active once the user proves they can generate a valid code
// with confirmTwoFactor, so a typo'd authenticator app setup can't lock
// them out of their own account.
export const setupTwoFactor = async (req, res) => {
  const user = await User.findById(req.user._id);
  const secret = speakeasy.generateSecret({
    name: `DripWatch (${user.email})`,
  });
  user.twoFactorSecret = secret.base32;
  user.twoFactorEnabled = false;
  await user.save();

  const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
  return success(res, { data: { qrDataUrl, manualEntryKey: secret.base32 } });
};

export const confirmTwoFactor = async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user._id).select('+twoFactorSecret');
  if (!user.twoFactorSecret) {
    return failure(res, { message: 'Start two-factor setup first', status: 400 });
  }

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });
  if (!valid) {
    return failure(res, { message: 'Incorrect code. Check your authenticator app and try again.', status: 400 });
  }

  user.twoFactorEnabled = true;
  await user.save();
  return success(res, { message: 'Two-factor authentication enabled' });
};

export const disableTwoFactor = async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id).select('+password +twoFactorSecret');
  const match = await user.comparePassword(password || '');
  if (!match) {
    return failure(res, { message: 'Incorrect password', status: 401 });
  }
  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save();
  return success(res, { message: 'Two-factor authentication disabled' });
};

// Step 2 of login for accounts with 2FA enabled: exchange the short-lived
// pending token + a valid TOTP code for a real access token.
export const verifyLoginTwoFactor = async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) {
    return failure(res, { message: 'tempToken and code are required', status: 400 });
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, env.jwtSecret);
  } catch (err) {
    return failure(res, { message: 'Your session expired - please sign in again', status: 401 });
  }
  if (decoded.purpose !== '2fa-pending') {
    return failure(res, { message: 'Invalid token', status: 400 });
  }

  const user = await User.findById(decoded.id).select('+twoFactorSecret');
  if (!user || !user.isActive || !user.twoFactorEnabled) {
    return failure(res, { message: 'Two-factor authentication is not active for this account', status: 400 });
  }

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });
  if (!valid) {
    await recordLoginEvent(req, { user, success: false, method: '2fa', reason: 'invalid_code' });
    return failure(res, { message: 'Incorrect code', status: 401 });
  }

  await recordLoginEvent(req, { user, success: true, method: '2fa' });
  const token = generateToken(user);
  return success(res, { message: 'Logged in successfully', data: { user: user.toSafeObject(), token } });
};

export default { setupTwoFactor, confirmTwoFactor, disableTwoFactor, verifyLoginTwoFactor };
