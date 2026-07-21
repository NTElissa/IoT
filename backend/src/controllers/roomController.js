import Room from '../models/Room.js';
import { success, failure } from '../utils/apiResponse.js';

export const getRooms = async (req, res) => {
  let filter = {};
  // Non-admin staff only see rooms they're assigned to
  if (req.user.role === 'doctor') filter.assignedDoctors = req.user._id;
  if (req.user.role === 'nurse') filter.assignedNurses = req.user._id;

  const rooms = await Room.find(filter)
    .populate('assignedDoctors', 'name email phone')
    .populate('assignedNurses', 'name email phone')
    .sort({ roomNumber: 1 });
  return success(res, { data: rooms });
};

export const getRoom = async (req, res) => {
  const room = await Room.findById(req.params.id)
    .populate('assignedDoctors', 'name email phone')
    .populate('assignedNurses', 'name email phone');
  if (!room) return failure(res, { message: 'Room not found', status: 404 });
  return success(res, { data: room });
};

export const createRoom = async (req, res) => {
  const { roomNumber, ward, bedCount } = req.body;
  if (!roomNumber || !ward) {
    return failure(res, { message: 'Room number and ward are required', status: 400 });
  }
  const existing = await Room.findOne({ roomNumber });
  if (existing) {
    return failure(res, { message: 'A room with this number already exists', status: 409 });
  }
  const room = await Room.create({
    roomNumber,
    ward,
    bedCount: bedCount || 1,
    createdBy: req.user._id,
  });
  return success(res, { message: 'Room created', data: room, status: 201 });
};

export const updateRoom = async (req, res) => {
  const { ward, bedCount, status } = req.body;
  const room = await Room.findById(req.params.id);
  if (!room) return failure(res, { message: 'Room not found', status: 404 });
  if (ward !== undefined) room.ward = ward;
  if (bedCount !== undefined) room.bedCount = bedCount;
  if (status !== undefined) room.status = status;
  await room.save();
  return success(res, { message: 'Room updated', data: room });
};

export const assignStaff = async (req, res) => {
  const { doctorIds = [], nurseIds = [] } = req.body;
  const room = await Room.findById(req.params.id);
  if (!room) return failure(res, { message: 'Room not found', status: 404 });
  room.assignedDoctors = doctorIds;
  room.assignedNurses = nurseIds;
  await room.save();
  const populated = await room.populate(['assignedDoctors', 'assignedNurses']);
  return success(res, { message: 'Room staff assignment updated', data: populated });
};

export const deleteRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return failure(res, { message: 'Room not found', status: 404 });
  await room.deleteOne();
  return success(res, { message: 'Room deleted' });
};

export default { getRooms, getRoom, createRoom, updateRoom, assignStaff, deleteRoom };
