import IVFluid from '../models/IVFluid.js';
import Room from '../models/Room.js';
import { success } from '../utils/apiResponse.js';

export const getAlerts = async (req, res) => {
  let roomFilter = {};
  if (req.user.role === 'doctor' || req.user.role === 'nurse') {
    const roomField = req.user.role === 'doctor' ? 'assignedDoctors' : 'assignedNurses';
    const rooms = await Room.find({ [roomField]: req.user._id }).select('_id');
    roomFilter.room = { $in: rooms.map((r) => r._id) };
  }

  const bags = await IVFluid.find({ ...roomFilter, 'alerts.0': { $exists: true } })
    .populate('room', 'roomNumber ward')
    .populate('patient', 'name bed')
    .sort({ updatedAt: -1 });

  const alerts = [];
  bags.forEach((bag) => {
    bag.alerts.forEach((alert) => {
      alerts.push({
        _id: alert._id,
        ivFluidId: bag._id,
        room: bag.room,
        patient: bag.patient,
        fluidLevel: bag.fluidLevel,
        type: alert.type,
        message: alert.message,
        timestamp: alert.timestamp,
        acknowledged: alert.acknowledged,
        acknowledgedAt: alert.acknowledgedAt,
        escalated: alert.escalated,
      });
    });
  });

  alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return success(res, { data: alerts });
};

export default { getAlerts };
