import IVFluid, { OPEN_STATUSES } from '../models/IVFluid.js';
import Room from '../models/Room.js';
import Patient from '../models/Patient.js';
import Task from '../models/Task.js';
import IVEventLog from '../models/IVEventLog.js';
import { calculateFluidLevel, estimateEmptyTime } from '../services/ivCalculationService.js';
import { broadcastIVUpdate } from '../services/notificationService.js';
import { success, failure } from '../utils/apiResponse.js';

const staffCanAccessRoom = async (user, roomId, hospitalId) => {
  if (user.role === 'admin') return true;
  const room = await Room.findOne({ _id: roomId, hospital: hospitalId });
  if (!room) return false;
  if (user.role === 'doctor') return room.assignedDoctors.some((id) => id.toString() === user._id.toString());
  if (user.role === 'nurse') return room.assignedNurses.some((id) => id.toString() === user._id.toString());
  return false;
};

// Ids of the doctors/nurses assigned to a room - used to scope broadcasts so
// a doctor/nurse only ever receives updates for their own patients.
const getRoomStaffIds = async (roomId) => {
  if (!roomId) return [];
  const room = await Room.findById(roomId);
  if (!room) return [];
  return [...room.assignedDoctors, ...room.assignedNurses].map((id) => id.toString());
};

export const getIVFluids = async (req, res) => {
  let filter = { hospital: req.user.hospital };
  if (req.user.role === 'doctor' || req.user.role === 'nurse') {
    const roomField = req.user.role === 'doctor' ? 'assignedDoctors' : 'assignedNurses';
    const rooms = await Room.find({ hospital: req.user.hospital, [roomField]: req.user._id }).select('_id');
    filter.room = { $in: rooms.map((r) => r._id) };
  } else if (req.user.role === 'staff') {
    const tasks = await Task.find({ hospital: req.user.hospital, assignedTo: req.user._id }).select('patient');
    filter.patient = { $in: tasks.map((t) => t.patient) };
  } else if (req.user.role === 'patient') {
    filter.patient = req.user.patient;
  }
  const { status } = req.query;
  if (status) filter.status = status;

  const bags = await IVFluid.find(filter)
    .populate('room', 'roomNumber ward')
    .populate('patient', 'name bed')
    .sort({ createdAt: -1 });
  return success(res, { data: bags });
};

export const getIVFluid = async (req, res) => {
  const bag = await IVFluid.findOne({ _id: req.params.id, hospital: req.user.hospital })
    .populate('room')
    .populate('patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  if (!(await staffCanAccessRoom(req.user, bag.room._id, req.user.hospital))) {
    return failure(res, { message: 'You are not assigned to this room', status: 403 });
  }
  return success(res, { data: bag });
};

// Assign / start a new IV fluid bag on a room+patient. Only assigned
// doctor/nurse for that room (or admin) may do this. If the patient already
// has an open (not completed/removed) IV fluid, this returns a
// confirmation-required warning unless `force: true` is passed - in which
// case the previous bag is marked as superseded/removed and the new one
// starts fresh. This is what prevents two staff members from silently
// double-assigning fluids to the same patient at the same time.
export const createIVFluid = async (req, res) => {
  const { fluidType, bagSize, emptyBagWeight, flowRate, room, patient, force } = req.body;
  if (!fluidType || !bagSize || !room || !patient) {
    return failure(res, { message: 'fluidType, bagSize, room and patient are required', status: 400 });
  }
  if (!(await staffCanAccessRoom(req.user, room, req.user.hospital))) {
    return failure(res, { message: 'You are not assigned to this room', status: 403 });
  }
  const roomDoc = await Room.findOne({ _id: room, hospital: req.user.hospital });
  if (!roomDoc) return failure(res, { message: 'Room not found', status: 404 });
  const patientDoc = await Patient.findOne({ _id: patient, hospital: req.user.hospital });
  if (!patientDoc) return failure(res, { message: 'Patient not found', status: 404 });

  const existingOpenBag = await IVFluid.findOne({ patient, status: { $in: OPEN_STATUSES } })
    .populate('room', 'roomNumber')
    .populate('startedBy', 'name role');

  if (existingOpenBag && !force) {
    return failure(res, {
      message: `${patientDoc.name} already has an IV fluid in progress (${existingOpenBag.fluidType}, ${Math.round(
        existingOpenBag.fluidLevel
      )}% remaining, started by ${existingOpenBag.startedBy?.name || 'a staff member'}). Confirm to end that one and start a new bag.`,
      status: 409,
      data: { requiresConfirmation: true, existingBag: existingOpenBag },
    });
  }

  if (existingOpenBag && force) {
    existingOpenBag.status = 'removed';
    existingOpenBag.endTime = new Date();
    await existingOpenBag.save();
    await IVEventLog.create({
      hospital: req.user.hospital,
      ivFluid: existingOpenBag._id,
      room: existingOpenBag.room._id,
      patient,
      eventType: 'bag_removed',
      performedBy: req.user._id,
      details: { reason: 'superseded by a new IV fluid' },
    });
  }

  const emptyWeight = emptyBagWeight || 30;
  const initialWeight = emptyWeight + Number(bagSize); // approx 1ml = 1g

  const bag = await IVFluid.create({
    hospital: req.user.hospital,
    fluidType,
    bagSize,
    emptyBagWeight: emptyWeight,
    initialWeight,
    currentWeight: initialWeight,
    flowRate: flowRate || 150,
    fluidLevel: 100,
    room,
    patient,
    startedBy: req.user._id,
    estimatedEmptyTime: estimateEmptyTime({
      currentWeight: initialWeight,
      emptyBagWeight: emptyWeight,
      flowRate: flowRate || 150,
    }),
  });

  await IVEventLog.create({
    hospital: req.user.hospital,
    ivFluid: bag._id,
    room,
    patient,
    eventType: 'bag_hung',
    performedBy: req.user._id,
    details: { fluidType, bagSize },
  });

  const populated = await bag.populate(['room', 'patient']);
  broadcastIVUpdate(populated, await getRoomStaffIds(room), req.user.hospital);
  return success(res, { message: 'IV fluid started', data: populated, status: 201 });
};

export const updateIVFluid = async (req, res) => {
  const bag = await IVFluid.findOne({ _id: req.params.id, hospital: req.user.hospital }).populate('room patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  if (!(await staffCanAccessRoom(req.user, bag.room._id, req.user.hospital))) {
    return failure(res, { message: 'You are not assigned to this room', status: 403 });
  }

  const { flowRate, currentWeight, status } = req.body;
  if (flowRate !== undefined) bag.flowRate = flowRate;
  if (currentWeight !== undefined) {
    bag.currentWeight = currentWeight;
    bag.fluidLevel = calculateFluidLevel(bag);
    bag.estimatedEmptyTime = estimateEmptyTime(bag);
  }
  if (status !== undefined) bag.status = status;

  await bag.save();
  broadcastIVUpdate(bag, await getRoomStaffIds(bag.room._id), req.user.hospital);
  return success(res, { message: 'IV fluid updated', data: bag });
};

// Doctors/nurses/admin can pause ("inactive") or resume ("active")
// monitoring on a bag without ending it - e.g. while a patient is off the
// ward for a procedure.
export const toggleActive = async (req, res) => {
  const bag = await IVFluid.findOne({ _id: req.params.id, hospital: req.user.hospital }).populate('room patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  if (!(await staffCanAccessRoom(req.user, bag.room._id, req.user.hospital))) {
    return failure(res, { message: 'You are not assigned to this room', status: 403 });
  }
  if (['completed', 'removed'].includes(bag.status)) {
    return failure(res, { message: 'This IV fluid has already ended and cannot be toggled', status: 400 });
  }

  if (bag.status === 'inactive') {
    const level = calculateFluidLevel(bag);
    bag.status = level < 10 ? 'alert_low' : level > 90 ? 'alert_high' : 'active';
    bag.pausedAt = undefined;
    bag.estimatedEmptyTime = estimateEmptyTime(bag);
  } else {
    bag.status = 'inactive';
    bag.pausedAt = new Date();
  }

  await bag.save();

  await IVEventLog.create({
    hospital: req.user.hospital,
    ivFluid: bag._id,
    room: bag.room._id,
    patient: bag.patient._id,
    eventType: bag.status === 'inactive' ? 'bag_removed' : 'bag_hung',
    performedBy: req.user._id,
    details: { note: bag.status === 'inactive' ? 'monitoring paused' : 'monitoring resumed' },
  });

  broadcastIVUpdate(bag, await getRoomStaffIds(bag.room._id), req.user.hospital);
  return success(res, { message: bag.status === 'inactive' ? 'Monitoring paused' : 'Monitoring resumed', data: bag });
};

// Replace the bag (task completion action) - resets weight to a fresh bag
export const changeBag = async (req, res) => {
  const bag = await IVFluid.findOne({ _id: req.params.id, hospital: req.user.hospital }).populate('room patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });

  bag.currentWeight = bag.initialWeight;
  bag.fluidLevel = 100;
  bag.status = 'active';
  bag.startTime = new Date();
  bag.estimatedEmptyTime = estimateEmptyTime(bag);
  await bag.save();

  await IVEventLog.create({
    hospital: req.user.hospital,
    ivFluid: bag._id,
    room: bag.room._id,
    patient: bag.patient._id,
    eventType: 'bag_changed',
    performedBy: req.user._id,
  });

  broadcastIVUpdate(bag, await getRoomStaffIds(bag.room._id), req.user.hospital);
  return success(res, { message: 'IV bag changed', data: bag });
};

export const removeIVFluid = async (req, res) => {
  const bag = await IVFluid.findOne({ _id: req.params.id, hospital: req.user.hospital }).populate('room patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  if (!(await staffCanAccessRoom(req.user, bag.room._id, req.user.hospital))) {
    return failure(res, { message: 'You are not assigned to this room', status: 403 });
  }
  bag.status = 'removed';
  bag.endTime = new Date();
  await bag.save();

  await IVEventLog.create({
    hospital: req.user.hospital,
    ivFluid: bag._id,
    room: bag.room._id,
    patient: bag.patient._id,
    eventType: 'bag_removed',
    performedBy: req.user._id,
  });

  broadcastIVUpdate(bag, await getRoomStaffIds(bag.room._id), req.user.hospital);
  return success(res, { message: 'IV fluid removed' });
};

// Permanently delete an IV fluid record. Admin-only (enforced at the route
// level) - unlike removeIVFluid above, this erases the record entirely
// rather than just marking it ended.
export const deleteIVFluid = async (req, res) => {
  const bag = await IVFluid.findOne({ _id: req.params.id, hospital: req.user.hospital });
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  await bag.deleteOne();
  return success(res, { message: 'IV fluid record permanently deleted' });
};

export const acknowledgeAlert = async (req, res) => {
  const { alertId } = req.params;
  const bag = await IVFluid.findOne({ _id: req.params.id, hospital: req.user.hospital }).populate('room patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  const alert = bag.alerts.id(alertId);
  if (!alert) return failure(res, { message: 'Alert not found', status: 404 });
  alert.acknowledged = true;
  alert.acknowledgedBy = req.user._id;
  alert.acknowledgedAt = new Date();
  await bag.save();

  await IVEventLog.create({
    hospital: req.user.hospital,
    ivFluid: bag._id,
    eventType: 'alert_acknowledged',
    performedBy: req.user._id,
    details: { alertId },
  });

  broadcastIVUpdate(bag, await getRoomStaffIds(bag.room?._id), req.user.hospital);
  return success(res, { message: 'Alert acknowledged', data: bag });
};

// Record an IV-related complication for reporting purposes
export const recordComplication = async (req, res) => {
  const bag = await IVFluid.findOne({ _id: req.params.id, hospital: req.user.hospital }).populate('room patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  const { description } = req.body;
  if (!description) return failure(res, { message: 'Description is required', status: 400 });

  await IVEventLog.create({
    hospital: req.user.hospital,
    ivFluid: bag._id,
    room: bag.room._id,
    patient: bag.patient._id,
    eventType: 'complication_recorded',
    performedBy: req.user._id,
    details: { description },
  });

  return success(res, { message: 'Complication recorded' });
};

export default {
  getIVFluids,
  getIVFluid,
  createIVFluid,
  updateIVFluid,
  toggleActive,
  changeBag,
  removeIVFluid,
  deleteIVFluid,
  acknowledgeAlert,
  recordComplication,
};
