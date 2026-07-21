import Patient from '../models/Patient.js';
import Room from '../models/Room.js';
import { success, failure } from '../utils/apiResponse.js';

const canAccessPatient = (user, patient) => {
  if (user.role === 'admin') return true;
  if (user.role === 'doctor') return patient.assignedDoctor?.toString() === user._id.toString();
  if (user.role === 'nurse') return patient.assignedNurse?.toString() === user._id.toString();
  return false;
};

export const getPatients = async (req, res) => {
  const filter = {};
  if (req.user.role === 'doctor') filter.assignedDoctor = req.user._id;
  if (req.user.role === 'nurse') filter.assignedNurse = req.user._id;

  const patients = await Patient.find(filter)
    .populate('room', 'roomNumber ward')
    .populate('assignedDoctor', 'name')
    .populate('assignedNurse', 'name')
    .sort({ createdAt: -1 });
  return success(res, { data: patients });
};

export const getPatient = async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate('room', 'roomNumber ward')
    .populate('assignedDoctor', 'name email phone')
    .populate('assignedNurse', 'name email phone');
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  if (!canAccessPatient(req.user, patient)) {
    return failure(res, { message: 'Not authorized to view this patient', status: 403 });
  }
  return success(res, { data: patient });
};

// Only admins register patients and make room/staff assignments
export const createPatient = async (req, res) => {
  const { name, dateOfBirth, gender, contact, medicalHistory, room, bed, assignedDoctor, assignedNurse } =
    req.body;
  if (!name || !gender) {
    return failure(res, { message: 'Name and gender are required', status: 400 });
  }
  if (room) {
    const roomDoc = await Room.findById(room);
    if (!roomDoc) return failure(res, { message: 'Selected room does not exist', status: 400 });
  }
  const patient = await Patient.create({
    name,
    dateOfBirth,
    gender,
    contact,
    medicalHistory,
    room,
    bed,
    assignedDoctor,
    assignedNurse,
    createdBy: req.user._id,
  });
  return success(res, { message: 'Patient registered', data: patient, status: 201 });
};

export const updatePatient = async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });

  const { name, contact, medicalHistory, room, bed, assignedDoctor, assignedNurse, status } = req.body;

  if (req.user.role === 'admin') {
    if (room !== undefined) patient.room = room;
    if (bed !== undefined) patient.bed = bed;
    if (assignedDoctor !== undefined) patient.assignedDoctor = assignedDoctor;
    if (assignedNurse !== undefined) patient.assignedNurse = assignedNurse;
    if (status !== undefined) {
      patient.status = status;
      if (status === 'discharged') patient.dischargedAt = new Date();
    }
  } else if (!canAccessPatient(req.user, patient)) {
    return failure(res, { message: 'Not authorized to update this patient', status: 403 });
  }

  if (name !== undefined) patient.name = name;
  if (contact !== undefined) patient.contact = contact;
  if (medicalHistory !== undefined) patient.medicalHistory = medicalHistory;

  await patient.save();
  return success(res, { message: 'Patient updated', data: patient });
};

export const deletePatient = async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  await patient.deleteOne();
  return success(res, { message: 'Patient record removed' });
};

export default { getPatients, getPatient, createPatient, updatePatient, deletePatient };
