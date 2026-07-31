import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import Patient from '../models/Patient.js';
import generateToken, { generatePendingTwoFactorToken } from '../utils/generateToken.js';
import { recordLoginEvent } from '../services/loginAudit.js';
import env from '../config/env.js';
import { success, failure } from '../utils/apiResponse.js';

// Public registration only ever creates the platform's very first
// super_admin (a one-time bootstrap for a brand-new deployment). After
// that, it's permanently closed: a super_admin creates hospitals + their
// admin accounts, and an admin creates every other account (doctor, nurse,
// staff, or additional admins) within their own hospital.
export const register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return failure(res, { message: 'Name, email and password are required', status: 400 });
  }
  if (password.length < 8) {
    return failure(res, { message: 'Password must be at least 8 characters', status: 400 });
  }

  const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
  if (existingSuperAdmin) {
    return failure(res, {
      message:
        'Platform registration is closed. Ask your super administrator or hospital administrator for an account.',
      status: 403,
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return failure(res, { message: 'An account with this email already exists', status: 409 });
  }

  const user = await User.create({ name, email, password, phone, role: 'super_admin', hospital: null });
  const token = generateToken(user);
  return success(res, {
    message: 'Super administrator account created. You can now sign in.',
    data: { user: user.toSafeObject(), token },
    status: 201,
  });
};

// Checks a hospital-scoped user's hospital is still active, and returns a
// failure response if not (used by every login method, not just password).
export const checkHospitalActive = async (user, res) => {
  if (!user.hospital) return true;
  const hospital = await Hospital.findById(user.hospital);
  if (!hospital || !hospital.isActive) {
    failure(res, { message: 'This hospital account has been suspended', status: 403 });
    return false;
  }
  return true;
};

// Finishes a successful credential check (password/passkey/Google): resets
// any lockout counters, gates on 2FA if enabled, logs the event, and issues
// the appropriate token.
export const completeLogin = async (req, res, user, method) => {
  if (user.failedLoginAttempts || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
  }

  if (!(await checkHospitalActive(user, res))) {
    await recordLoginEvent(req, { user, success: false, method, reason: 'hospital_suspended' });
    return;
  }

  if (user.twoFactorEnabled) {
    await recordLoginEvent(req, { user, success: true, method, reason: 'awaiting_2fa' });
    return success(res, {
      message: 'Enter your two-factor authentication code to finish signing in',
      data: { requiresTwoFactor: true, tempToken: generatePendingTwoFactorToken(user) },
    });
  }

  await recordLoginEvent(req, { user, success: true, method });
  const token = generateToken(user);
  return success(res, { message: 'Logged in successfully', data: { user: user.toSafeObject(), token } });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return failure(res, { message: 'Email and password are required', status: 400 });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    await recordLoginEvent(req, { email, success: false, method: 'password', reason: 'no_such_account' });
    return failure(res, { message: 'Invalid credentials', status: 401 });
  }

  if (user.isLocked()) {
    await recordLoginEvent(req, { user, success: false, method: 'password', reason: 'account_locked' });
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return failure(res, {
      message: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      status: 423,
    });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= env.maxLoginAttempts) {
      user.lockUntil = new Date(Date.now() + env.lockMinutes * 60 * 1000);
    }
    await user.save();
    await recordLoginEvent(req, {
      user,
      success: false,
      method: 'password',
      reason: user.lockUntil ? 'account_locked' : 'invalid_password',
    });
    return failure(res, { message: 'Invalid credentials', status: 401 });
  }

  return completeLogin(req, res, user, 'password');
};

// Patients sign in with their patientCode instead of an email, but go
// through the exact same lockout/2FA/audit-logging path as everyone else -
// their portal account is a regular User document underneath.
export const patientLogin = async (req, res) => {
  const { patientCode, password } = req.body;
  if (!patientCode || !password) {
    return failure(res, { message: 'Patient ID and password are required', status: 400 });
  }

  const patient = await Patient.findOne({ patientCode: patientCode.toUpperCase().trim() });
  if (!patient || !patient.portalEnabled || !patient.portalUser) {
    await recordLoginEvent(req, { email: patientCode, success: false, method: 'password', reason: 'no_such_account' });
    return failure(res, { message: 'Invalid patient ID or password', status: 401 });
  }

  const user = await User.findById(patient.portalUser).select('+password');
  if (!user || !user.isActive) {
    await recordLoginEvent(req, { email: patientCode, success: false, method: 'password', reason: 'no_such_account' });
    return failure(res, { message: 'Invalid patient ID or password', status: 401 });
  }

  if (user.isLocked()) {
    await recordLoginEvent(req, { user, success: false, method: 'password', reason: 'account_locked' });
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return failure(res, {
      message: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      status: 423,
    });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= env.maxLoginAttempts) {
      user.lockUntil = new Date(Date.now() + env.lockMinutes * 60 * 1000);
    }
    await user.save();
    await recordLoginEvent(req, {
      user,
      success: false,
      method: 'password',
      reason: user.lockUntil ? 'account_locked' : 'invalid_password',
    });
    return failure(res, { message: 'Invalid patient ID or password', status: 401 });
  }

  return completeLogin(req, res, user, 'password');
};

export const me = async (req, res) => {
  return success(res, { data: { user: req.user.toSafeObject() } });
};

export const logout = async (req, res) => {
  return success(res, { message: 'Logged out' });
};

export default { register, login, patientLogin, me, logout, completeLogin, checkHospitalActive };
