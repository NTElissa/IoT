import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { success, failure } from '../utils/apiResponse.js';

// Public registration is intentionally limited to the very first admin
// account (bootstrap). All other accounts (doctor/nurse/support_staff, and
// any further admins) must be created by an existing admin via
// POST /api/v1/users. This enforces the "administrators manage staff
// accounts" requirement.
export const register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return failure(res, { message: 'Name, email and password are required', status: 400 });
  }

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return failure(res, {
      message:
        'Public registration is closed. Ask an existing administrator to create your account.',
      status: 403,
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return failure(res, { message: 'An account with this email already exists', status: 409 });
  }

  const user = await User.create({ name, email, password, phone, role: 'admin' });
  const token = generateToken(user);
  return success(res, {
    message: 'Administrator account created. You can now sign in.',
    data: { user: user.toSafeObject(), token },
    status: 201,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return failure(res, { message: 'Email and password are required', status: 400 });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    return failure(res, { message: 'Invalid credentials', status: 401 });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    return failure(res, { message: 'Invalid credentials', status: 401 });
  }

  const token = generateToken(user);
  return success(res, {
    message: 'Logged in successfully',
    data: { user: user.toSafeObject(), token },
  });
};

export const me = async (req, res) => {
  return success(res, { data: { user: req.user.toSafeObject() } });
};

export const logout = async (req, res) => {
  // Stateless JWT - client discards the token. Present for API completeness.
  return success(res, { message: 'Logged out' });
};

export default { register, login, me, logout };
