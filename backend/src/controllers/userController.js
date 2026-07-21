import User from '../models/User.js';
import { success, failure } from '../utils/apiResponse.js';

export const getUsers = async (req, res) => {
  const { role, ward } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (ward) filter.ward = ward;
  const users = await User.find(filter).sort({ createdAt: -1 });
  return success(res, { data: users.map((u) => u.toSafeObject()) });
};

export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return failure(res, { message: 'User not found', status: 404 });
  return success(res, { data: user.toSafeObject() });
};

export const createUser = async (req, res) => {
  const { name, email, password, role, phone, ward } = req.body;
  if (!name || !email || !password || !role) {
    return failure(res, { message: 'Name, email, password and role are required', status: 400 });
  }
  if (!['admin', 'doctor', 'nurse', 'support_staff'].includes(role)) {
    return failure(res, { message: 'Invalid role', status: 400 });
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return failure(res, { message: 'An account with this email already exists', status: 409 });
  }
  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    ward,
    createdBy: req.user._id,
  });
  return success(res, {
    message: `${role} account created`,
    data: user.toSafeObject(),
    status: 201,
  });
};

export const updateUser = async (req, res) => {
  const { name, phone, ward, isActive, role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return failure(res, { message: 'User not found', status: 404 });

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (ward !== undefined) user.ward = ward;
  if (isActive !== undefined) user.isActive = isActive;
  if (role !== undefined) user.role = role;

  await user.save();
  return success(res, { message: 'User updated', data: user.toSafeObject() });
};

export const resetPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return failure(res, { message: 'Password must be at least 6 characters', status: 400 });
  }
  const user = await User.findById(req.params.id).select('+password');
  if (!user) return failure(res, { message: 'User not found', status: 404 });
  user.password = password;
  await user.save();
  return success(res, { message: 'Password reset' });
};

export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return failure(res, { message: 'User not found', status: 404 });
  // Soft delete to preserve historical references (tasks, logs, room assignments)
  user.isActive = false;
  await user.save();
  return success(res, { message: 'User deactivated' });
};

export default { getUsers, getUser, createUser, updateUser, resetPassword, deleteUser };
