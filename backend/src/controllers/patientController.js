import Patient from '../models/Patient.js';
import Room from '../models/Room.js';
import IVFluid from '../models/IVFluid.js';
import Task from '../models/Task.js';
import IVEventLog from '../models/IVEventLog.js';
import PatientNote from '../models/PatientNote.js';
import { success, failure } from '../utils/apiResponse.js';

const canAccessPatient = (user, patient) => {
  if (user.role === 'admin') return true;
  if (user.role === 'doctor') return patient.assignedDoctor?.toString() === user._id.toString();
  if (user.role === 'nurse') return patient.assignedNurse?.toString() === user._id.toString();
  return false;
};

export const getPatients = async (req, res) => {
  const filter = { hospital: req.user.hospital };
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
  const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.hospital })
    .populate('room', 'roomNumber ward')
    .populate('assignedDoctor', 'name email phone')
    .populate('assignedNurse', 'name email phone');
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  if (!canAccessPatient(req.user, patient)) {
    return failure(res, { message: 'Not authorized to view this patient', status: 403 });
  }
  return success(res, { data: patient });
};

// Admins register any patient and assign room/care team freely. Doctors can
// also register a brand-new patient (one who hasn't been in the system
// before) - they automatically become the assigned doctor, and if they
// pick a room they weren't yet formally assigned to, they're added to that
// room's staff so their later IV-fluid actions there are authorized too.
// assignedNurse should be one of the nurses already assigned to the chosen
// room (the frontend limits the picker to that list).
export const createPatient = async (req, res) => {
  const { name, dateOfBirth, gender, contact, medicalHistory, room, bed, assignedDoctor, assignedNurse } =
    req.body;
  if (!name || !gender) {
    return failure(res, { message: 'Name and gender are required', status: 400 });
  }

  let roomDoc = null;
  if (room) {
    roomDoc = await Room.findOne({ _id: room, hospital: req.user.hospital });
    if (!roomDoc) return failure(res, { message: 'Selected room does not exist', status: 400 });
  }

  const isDoctor = req.user.role === 'doctor';
  const finalAssignedDoctor = isDoctor ? req.user._id : assignedDoctor;

  const patient = await Patient.create({
    hospital: req.user.hospital,
    name,
    dateOfBirth,
    gender,
    contact,
    medicalHistory,
    room,
    bed,
    assignedDoctor: finalAssignedDoctor,
    assignedNurse,
    createdBy: req.user._id,
  });

  if (isDoctor && roomDoc && !roomDoc.assignedDoctors.some((id) => id.toString() === req.user._id.toString())) {
    roomDoc.assignedDoctors.push(req.user._id);
    await roomDoc.save();
  }

  return success(res, { message: 'Patient registered', data: patient, status: 201 });
};

export const updatePatient = async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });

  const { name, contact, medicalHistory, room, bed, assignedDoctor, assignedNurse, status } = req.body;
  const isAdmin = req.user.role === 'admin';
  const isAssignedCarer = canAccessPatient(req.user, patient);

  if (!isAdmin && !isAssignedCarer) {
    return failure(res, { message: 'Not authorized to update this patient', status: 403 });
  }

  if (isAdmin) {
    if (assignedDoctor !== undefined) patient.assignedDoctor = assignedDoctor;
    if (assignedNurse !== undefined) patient.assignedNurse = assignedNurse;
    if (status !== undefined) {
      patient.status = status;
      if (status === 'discharged') patient.dischargedAt = new Date();
    }
  }

  // Both admins and the assigned doctor/nurse may move a patient to a
  // different room/bed.
  if ((isAdmin || isAssignedCarer) && room !== undefined && room !== (patient.room?.toString() || '')) {
    const newRoom = await Room.findOne({ _id: room, hospital: req.user.hospital });
    if (!newRoom) return failure(res, { message: 'Selected room does not exist', status: 400 });

    const previousRoomId = patient.room;
    patient.room = room;

    // If a doctor/nurse moves their patient into a room they aren't yet
    // formally assigned to, add them so their IV-fluid actions there stay
    // authorized - mirrors the same behavior as registering a new patient.
    if (!isAdmin) {
      if (
        req.user.role === 'doctor' &&
        !newRoom.assignedDoctors.some((id) => id.toString() === req.user._id.toString())
      ) {
        newRoom.assignedDoctors.push(req.user._id);
        await newRoom.save();
      }
      if (
        req.user.role === 'nurse' &&
        !newRoom.assignedNurses.some((id) => id.toString() === req.user._id.toString())
      ) {
        newRoom.assignedNurses.push(req.user._id);
        await newRoom.save();
      }
    }

    await IVEventLog.create({
      hospital: req.user.hospital,
      patient: patient._id,
      room,
      eventType: 'patient_room_changed',
      performedBy: req.user._id,
      details: { from: previousRoomId, to: room },
    });
  }
  if ((isAdmin || isAssignedCarer) && bed !== undefined) patient.bed = bed;

  if (name !== undefined) patient.name = name;
  if (contact !== undefined) patient.contact = contact;
  if (medicalHistory !== undefined) patient.medicalHistory = medicalHistory;

  await patient.save();
  return success(res, { message: 'Patient updated', data: patient });
};

export const deletePatient = async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  await patient.deleteOne();
  return success(res, { message: 'Patient record removed' });
};

// Full care history for a patient: every IV fluid ever started (including
// completed/removed ones), every task raised on their behalf, notes, and
// the raw event log. Only the assigned doctor/nurse (or admin) may view this.
export const getPatientHistory = async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  if (!canAccessPatient(req.user, patient)) {
    return failure(res, { message: 'Not authorized to view this patient\u2019s history', status: 403 });
  }

  const [ivFluids, tasks, events, notes] = await Promise.all([
    IVFluid.find({ patient: patient._id }).populate('room', 'roomNumber ward').sort({ createdAt: -1 }),
    Task.find({ patient: patient._id })
      .populate('assignedBy', 'name role')
      .populate('assignedTo', 'name role')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 }),
    IVEventLog.find({ patient: patient._id })
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(100),
    PatientNote.find({ patient: patient._id }).populate('author', 'name role').sort({ createdAt: -1 }),
  ]);

  return success(res, { data: { patient, ivFluids, tasks, events, notes } });
};

// Comments and medication/drug entries on a patient's chart. Only the
// assigned doctor/nurse (or admin) may add or view these.
export const getPatientNotes = async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  if (!canAccessPatient(req.user, patient)) {
    return failure(res, { message: 'Not authorized to view this patient\u2019s notes', status: 403 });
  }
  const notes = await PatientNote.find({ patient: patient._id })
    .populate('author', 'name role')
    .sort({ createdAt: -1 });
  return success(res, { data: notes });
};

export const createPatientNote = async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!patient) return failure(res, { message: 'Patient not found', status: 404 });
  if (!canAccessPatient(req.user, patient)) {
    return failure(res, { message: 'Not authorized to add notes for this patient', status: 403 });
  }

  const { type, text, drugName, dosage, frequency, instructions } = req.body;
  if (type === 'medication' && !drugName) {
    return failure(res, { message: 'Drug name is required for a medication entry', status: 400 });
  }
  if (type !== 'medication' && !text) {
    return failure(res, { message: 'Comment text is required', status: 400 });
  }

  const note = await PatientNote.create({
    hospital: req.user.hospital,
    patient: patient._id,
    author: req.user._id,
    type: type === 'medication' ? 'medication' : 'comment',
    text,
    drugName,
    dosage,
    frequency,
    instructions,
  });

  const populated = await note.populate('author', 'name role');

  await IVEventLog.create({
    hospital: req.user.hospital,
    patient: patient._id,
    eventType: 'note_added',
    performedBy: req.user._id,
    details: { type: note.type, drugName: note.drugName },
  });

  return success(res, { message: 'Note added', data: populated, status: 201 });
};

export default {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientHistory,
  getPatientNotes,
  createPatientNote,
};
