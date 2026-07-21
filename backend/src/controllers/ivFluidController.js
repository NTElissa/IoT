import IVFluid from '../models/IVFluid.js';
import Room from '../models/Room.js';
import Patient from '../models/Patient.js';
import IVEventLog from '../models/IVEventLog.js';
import { calculateFluidLevel, estimateEmptyTime } from '../services/ivCalculationService.js';
import { broadcastIVUpdate } from '../services/notificationService.js';
import { success, failure } from '../utils/apiResponse.js';

const staffCanAccessRoom = async (user, roomId) => {
  if (user.role === 'admin') return true;
  const room = await Room.findById(roomId);
  if (!room) return false;
  if (user.role === 'doctor') return room.assignedDoctors.some((id) => id.toString() === user._id.toString());
  if (user.role === 'nurse') return room.assignedNurses.some((id) => id.toString() === user._id.toString());
  return false;
};

export const getIVFluids = async (req, res) => {
  let filter = {};
  if (req.user.role === 'doctor' || req.user.role === 'nurse') {
    const roomField = req.user.role === 'doctor' ? 'assignedDoctors' : 'assignedNurses';
    const rooms = await Room.find({ [roomField]: req.user._id }).select('_id');
    filter.room = { $in: rooms.map((r) => r._id) };
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
  const bag = await IVFluid.findById(req.params.id).populate('room').populate('patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  if (!(await staffCanAccessRoom(req.user, bag.room._id))) {
    return failure(res, { message: 'You are not assigned to this room', status: 403 });
  }
  return success(res, { data: bag });
};

// Assign / start a new IV fluid bag on a room+patient. Only assigned
// doctor/nurse for that room (or admin) may do this.
export const createIVFluid = async (req, res) => {
  const { fluidType, bagSize, emptyBagWeight, flowRate, room, patient } = req.body;
  if (!fluidType || !bagSize || !room || !patient) {
    return failure(res, { message: 'fluidType, bagSize, room and patient are required', status: 400 });
  }
  if (!(await staffCanAccessRoom(req.user, room))) {
    return failure(res, { message: 'You are not assigned to this room', status: 403 });
  }
  const patientDoc = await Patient.findById(patient);
  if (!patientDoc) return failure(res, { message: 'Patient not found', status: 404 });

  const emptyWeight = emptyBagWeight || 30;
  const initialWeight = emptyWeight + Number(bagSize); // approx 1ml = 1g

  const bag = await IVFluid.create({
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
    ivFluid: bag._id,
    room,
    patient,
    eventType: 'bag_hung',
    performedBy: req.user._id,
    details: { fluidType, bagSize },
  });

  const populated = await bag.populate(['room', 'patient']);
  broadcastIVUpdate(populated);
  return success(res, { message: 'IV fluid started', data: populated, status: 201 });
};

export const updateIVFluid = async (req, res) => {
  const bag = await IVFluid.findById(req.params.id).populate('room patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  if (!(await staffCanAccessRoom(req.user, bag.room._id))) {
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
  broadcastIVUpdate(bag);
  return success(res, { message: 'IV fluid updated', data: bag });
};

// Replace the bag (task completion action) - resets weight to a fresh bag
export const changeBag = async (req, res) => {
  const bag = await IVFluid.findById(req.params.id).populate('room patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });

  bag.currentWeight = bag.initialWeight;
  bag.fluidLevel = 100;
  bag.status = 'active';
  bag.startTime = new Date();
  bag.estimatedEmptyTime = estimateEmptyTime(bag);
  await bag.save();

  await IVEventLog.create({
    ivFluid: bag._id,
    room: bag.room._id,
    patient: bag.patient._id,
    eventType: 'bag_changed',
    performedBy: req.user._id,
  });

  broadcastIVUpdate(bag);
  return success(res, { message: 'IV bag changed', data: bag });
};

export const removeIVFluid = async (req, res) => {
  const bag = await IVFluid.findById(req.params.id).populate('room patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  bag.status = 'removed';
  bag.endTime = new Date();
  await bag.save();

  await IVEventLog.create({
    ivFluid: bag._id,
    room: bag.room._id,
    patient: bag.patient._id,
    eventType: 'bag_removed',
    performedBy: req.user._id,
  });

  broadcastIVUpdate(bag);
  return success(res, { message: 'IV fluid removed' });
};

export const acknowledgeAlert = async (req, res) => {
  const { alertId } = req.params;
  const bag = await IVFluid.findById(req.params.id);
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  const alert = bag.alerts.id(alertId);
  if (!alert) return failure(res, { message: 'Alert not found', status: 404 });
  alert.acknowledged = true;
  alert.acknowledgedBy = req.user._id;
  alert.acknowledgedAt = new Date();
  await bag.save();

  await IVEventLog.create({
    ivFluid: bag._id,
    eventType: 'alert_acknowledged',
    performedBy: req.user._id,
    details: { alertId },
  });

  broadcastIVUpdate(bag);
  return success(res, { message: 'Alert acknowledged', data: bag });
};

// Record an IV-related complication for reporting purposes
export const recordComplication = async (req, res) => {
  const bag = await IVFluid.findById(req.params.id).populate('room patient');
  if (!bag) return failure(res, { message: 'IV fluid record not found', status: 404 });
  const { description } = req.body;
  if (!description) return failure(res, { message: 'Description is required', status: 400 });

  await IVEventLog.create({
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
  changeBag,
  removeIVFluid,
  acknowledgeAlert,
  recordComplication,
};
