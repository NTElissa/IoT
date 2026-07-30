import User from '../models/User.js';
import Room from '../models/Room.js';
import IVEventLog from '../models/IVEventLog.js';
import { success, failure } from '../utils/apiResponse.js';

const HOSPITAL_ROLES = ['admin', 'doctor', 'nurse', 'staff'];

export const getUsers = async (req, res) => {
  const { role, ward } = req.query;
  // Hospital admins only ever see their own hospital's staff.
  const filter = { hospital: req.user.hospital };
  if (role) filter.role = role;
  if (ward) filter.ward = ward;
  const users = await User.find(filter).sort({ createdAt: -1 });
  return success(res, { data: users.map((u) => u.toSafeObject()) });
};

export const getUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!user) return failure(res, { message: 'User not found', status: 404 });
  return success(res, { data: user.toSafeObject() });
};

// Admin creates any staff account (including other admins) within their own
// hospital: doctor, nurse, staff, or admin.
export const createUser = async (req, res) => {
  const { name, email, password, role, phone, ward } = req.body;
  if (!name || !email || !password || !role) {
    return failure(res, { message: 'Name, email, password and role are required', status: 400 });
  }
  if (!HOSPITAL_ROLES.includes(role)) {
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
    hospital: req.user.hospital,
    createdBy: req.user._id,
  });
  return success(res, {
    message: `${role} account created`,
    data: user.toSafeObject(),
    status: 201,
  });
};

export const updateUser = async (req, res) => {
  const { name, phone, ward, isActive } = req.body;
  const user = await User.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!user) return failure(res, { message: 'User not found', status: 404 });

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (ward !== undefined) user.ward = ward;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();
  return success(res, { message: 'User updated', data: user.toSafeObject() });
};

// Admin changes a hospital user's role (e.g. nurse -> admin, staff -> nurse).
// Cannot be used on yourself or to create/remove a super_admin.
export const changeRole = async (req, res) => {
  const { role } = req.body;
  if (!HOSPITAL_ROLES.includes(role)) {
    return failure(res, { message: 'Invalid role', status: 400 });
  }
  if (req.params.id === req.user._id.toString()) {
    return failure(res, { message: 'You cannot change your own role', status: 400 });
  }
  const user = await User.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!user) return failure(res, { message: 'User not found', status: 404 });

  const previousRole = user.role;
  user.role = role;
  await user.save();

  // If they're no longer a doctor/nurse, drop them from any room assignments
  // so access control (and future notifications) stay correct.
  if ((previousRole === 'doctor' || previousRole === 'nurse') && previousRole !== role) {
    await Room.updateMany(
      { hospital: req.user.hospital },
      { $pull: { assignedDoctors: user._id, assignedNurses: user._id } }
    );
  }

  await IVEventLog.create({
    hospital: req.user.hospital,
    eventType: 'role_changed',
    performedBy: req.user._id,
    details: { userId: user._id, from: previousRole, to: role },
  });

  return success(res, { message: `Role changed from ${previousRole} to ${role}`, data: user.toSafeObject() });
};

export const resetPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return failure(res, { message: 'Password must be at least 6 characters', status: 400 });
  }
  const user = await User.findOne({ _id: req.params.id, hospital: req.user.hospital }).select('+password');
  if (!user) return failure(res, { message: 'User not found', status: 404 });
  user.password = password;
  await user.save();
  return success(res, { message: 'Password reset' });
};

export const deleteUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!user) return failure(res, { message: 'User not found', status: 404 });

  if (user._id.toString() === req.user._id.toString()) {
    return failure(res, { message: 'You cannot delete your own account', status: 400 });
  }
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ hospital: req.user.hospital, role: 'admin' });
    if (adminCount <= 1) {
      return failure(res, { message: 'Cannot delete the last remaining administrator for this hospital', status: 400 });
    }
  }

  await Room.updateMany(
    { hospital: req.user.hospital },
    { $pull: { assignedDoctors: user._id, assignedNurses: user._id } }
  );

  await user.deleteOne();
  return success(res, { message: 'User permanently deleted' });
};

export default { getUsers, getUser, createUser, updateUser, changeRole, resetPassword, deleteUser };
