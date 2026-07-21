import Room from '../models/Room.js';
import { failure } from '../utils/apiResponse.js';

// Verifies that the current user (if doctor/nurse) is assigned to the room
// referenced by req.body.room, req.params.roomId, or a resource already
// loaded onto req.resourceRoom (an ObjectId or Room doc).
// Admins and support_staff (acting on delegated tasks) bypass this check.
export const requireRoomAssignment = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();

    const roomId =
      req.resourceRoom ||
      req.body.room ||
      req.params.roomId ||
      req.query.room;

    if (!roomId) {
      return failure(res, { message: 'Room reference is required', status: 400 });
    }

    if (req.user.role === 'support_staff') {
      // Support staff act only via assigned tasks, not direct room management
      return next();
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return failure(res, { message: 'Room not found', status: 404 });
    }

    const isAssignedDoctor = room.assignedDoctors.some((id) => id.toString() === req.user._id.toString());
    const isAssignedNurse = room.assignedNurses.some((id) => id.toString() === req.user._id.toString());

    if (req.user.role === 'doctor' && !isAssignedDoctor) {
      return failure(res, { message: 'You are not assigned to this room', status: 403 });
    }
    if (req.user.role === 'nurse' && !isAssignedNurse) {
      return failure(res, { message: 'You are not assigned to this room', status: 403 });
    }

    req.room = room;
    next();
  } catch (err) {
    return failure(res, { message: 'Room access check failed', error: err.message, status: 500 });
  }
};

export default requireRoomAssignment;
