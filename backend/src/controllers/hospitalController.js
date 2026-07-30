import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Patient from '../models/Patient.js';
import IVFluid from '../models/IVFluid.js';
import Task from '../models/Task.js';
import IVEventLog from '../models/IVEventLog.js';
import Notification from '../models/Notification.js';
import { success, failure } from '../utils/apiResponse.js';

export const getHospitals = async (req, res) => {
  const hospitals = await Hospital.find().sort({ createdAt: -1 });
  const withCounts = await Promise.all(
    hospitals.map(async (h) => {
      const staffCount = await User.countDocuments({ hospital: h._id, isActive: true });
      const adminCount = await User.countDocuments({ hospital: h._id, role: 'admin', isActive: true });
      return { ...h.toObject(), staffCount, adminCount };
    })
  );
  return success(res, { data: withCounts });
};

export const getHospital = async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) return failure(res, { message: 'Hospital not found', status: 404 });
  const admins = await User.find({ hospital: hospital._id, role: 'admin' }).select('-password');
  return success(res, { data: { hospital, admins } });
};

// Registers a brand-new hospital and its first admin account in one step -
// only a super_admin can do this.
export const createHospital = async (req, res) => {
  const { name, address, phone, adminName, adminEmail, adminPassword, adminPhone } = req.body;
  if (!name || !adminName || !adminEmail || !adminPassword) {
    return failure(res, {
      message: 'Hospital name, admin name, admin email and admin password are required',
      status: 400,
    });
  }
  if (adminPassword.length < 6) {
    return failure(res, { message: 'Admin password must be at least 6 characters', status: 400 });
  }

  const existingEmail = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existingEmail) {
    return failure(res, { message: 'An account with this admin email already exists', status: 409 });
  }

  const hospital = await Hospital.create({ name, address, phone, createdBy: req.user._id });

  const admin = await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    phone: adminPhone,
    hospital: hospital._id,
    createdBy: req.user._id,
  });

  return success(res, {
    message: 'Hospital and admin account created',
    data: { hospital, admin: admin.toSafeObject() },
    status: 201,
  });
};

export const updateHospital = async (req, res) => {
  const { name, address, phone, isActive } = req.body;
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) return failure(res, { message: 'Hospital not found', status: 404 });
  if (name !== undefined) hospital.name = name;
  if (address !== undefined) hospital.address = address;
  if (phone !== undefined) hospital.phone = phone;
  if (isActive !== undefined) hospital.isActive = isActive;
  await hospital.save();

  // Suspending a hospital suspends its staff's ability to log in too.
  if (isActive === false) {
    await User.updateMany({ hospital: hospital._id }, { $set: { isActive: false } });
  }

  return success(res, { message: 'Hospital updated', data: hospital });
};

export const deleteHospital = async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) return failure(res, { message: 'Hospital not found', status: 404 });
  const hospitalId = hospital._id;
  await Promise.all([
    User.deleteMany({ hospital: hospitalId }),
    Room.deleteMany({ hospital: hospitalId }),
    Patient.deleteMany({ hospital: hospitalId }),
    IVFluid.deleteMany({ hospital: hospitalId }),
    Task.deleteMany({ hospital: hospitalId }),
    IVEventLog.deleteMany({ hospital: hospitalId }),
    Notification.deleteMany({ hospital: hospitalId }),
  ]);
  await hospital.deleteOne();
  return success(res, { message: 'Hospital and all its data permanently deleted' });
};

export default { getHospitals, getHospital, createHospital, updateHospital, deleteHospital };
