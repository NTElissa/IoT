import Task from '../models/Task.js';
import IVFluid from '../models/IVFluid.js';
import IVEventLog from '../models/IVEventLog.js';
import Patient from '../models/Patient.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { success } from '../utils/apiResponse.js';

// Doctors/nurses see a version of every report scoped to their own
// patients/rooms/tasks - never full hospital-wide data (that stays
// admin-only). Room ids assigned to the current user, or null for admin
// (meaning "no room restriction").
const scopedRoomIds = async (req) => {
  if (req.user.role === 'admin') return null;
  const roomField = req.user.role === 'doctor' ? 'assignedDoctors' : 'assignedNurses';
  const rooms = await Room.find({ hospital: req.user.hospital, [roomField]: req.user._id }).select('_id');
  return rooms.map((r) => r._id);
};

// Average time between task creation and completion, in minutes
export const responseTimes = async (req, res) => {
  const hospital = req.user.hospital;
  const taskFilter = { hospital, status: 'completed', completedAt: { $ne: null } };
  if (req.user.role !== 'admin') taskFilter.assignedBy = req.user._id;

  const completed = await Task.find(taskFilter);
  const durationsMin = completed.map(
    (t) => (new Date(t.completedAt) - new Date(t.createdAt)) / 60000
  );
  const avg = durationsMin.length
    ? Math.round((durationsMin.reduce((a, b) => a + b, 0) / durationsMin.length) * 10) / 10
    : 0;
  const escalatedFilter = { hospital, status: 'escalated' };
  if (req.user.role !== 'admin') escalatedFilter.assignedBy = req.user._id;
  const escalatedCount = await Task.countDocuments(escalatedFilter);

  return success(res, {
    data: {
      totalCompletedTasks: completed.length,
      averageResponseMinutes: avg,
      fastestMinutes: durationsMin.length ? Math.round(Math.min(...durationsMin) * 10) / 10 : null,
      slowestMinutes: durationsMin.length ? Math.round(Math.max(...durationsMin) * 10) / 10 : null,
      escalatedTaskCount: escalatedCount,
    },
  });
};

export const complications = async (req, res) => {
  const hospital = req.user.hospital;
  const roomIds = await scopedRoomIds(req);

  const logFilter = { hospital, eventType: 'complication_recorded' };
  if (roomIds) logFilter.room = { $in: roomIds };

  const logs = await IVEventLog.find(logFilter)
    .populate('patient', 'name')
    .populate('room', 'roomNumber')
    .sort({ createdAt: -1 });

  const bagFilter = { hospital };
  if (roomIds) bagFilter.room = { $in: roomIds };
  const totalBags = await IVFluid.countDocuments(bagFilter);
  const rate = totalBags ? Math.round((logs.length / totalBags) * 1000) / 10 : 0;

  return success(res, {
    data: {
      totalComplications: logs.length,
      totalIVBags: totalBags,
      complicationRatePercent: rate,
      records: logs,
    },
  });
};

export const workload = async (req, res) => {
  const hospital = req.user.hospital;
  const nurses = await User.find({ hospital, role: 'nurse', isActive: true });
  const results = [];
  for (const nurse of nurses) {
    const taskCount = await Task.countDocuments({ hospital, assignedBy: nurse._id });
    const roomCount = await Room.countDocuments({ hospital, assignedNurses: nurse._id });
    const patientCount = await Patient.countDocuments({ hospital, assignedNurse: nurse._id, status: 'admitted' });
    results.push({
      nurseId: nurse._id,
      name: nurse.name,
      ward: nurse.ward,
      tasksDelegated: taskCount,
      roomsAssigned: roomCount,
      activePatients: patientCount,
    });
  }
  return success(res, { data: results });
};

export const taskCompletion = async (req, res) => {
  const hospital = req.user.hospital;
  const baseFilter = { hospital };
  if (req.user.role !== 'admin') baseFilter.assignedBy = req.user._id;

  const statuses = ['pending', 'in_progress', 'completed', 'escalated'];
  const counts = {};
  for (const s of statuses) {
    counts[s] = await Task.countDocuments({ ...baseFilter, status: s });
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const completionRate = total ? Math.round((counts.completed / total) * 1000) / 10 : 0;
  return success(res, { data: { ...counts, total, completionRatePercent: completionRate } });
};

export const ivUsage = async (req, res) => {
  const hospital = req.user.hospital;
  const roomIds = await scopedRoomIds(req);
  const match = roomIds ? { hospital, room: { $in: roomIds } } : { hospital };

  const byType = await IVFluid.aggregate([
    { $match: match },
    { $group: { _id: '$fluidType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const byStatus = await IVFluid.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const totalAlerts = await IVFluid.aggregate([
    { $match: match },
    { $unwind: '$alerts' },
    { $group: { _id: '$alerts.type', count: { $sum: 1 } } },
  ]);
  return success(res, { data: { byType, byStatus, alerts: totalAlerts } });
};

export const overview = async (req, res) => {
  const hospital = req.user.hospital;
  const [patients, rooms, staff, activeBags, pendingTasks] = await Promise.all([
    Patient.countDocuments({ hospital, status: 'admitted' }),
    Room.countDocuments({ hospital }),
    User.countDocuments({ hospital, isActive: true, role: { $ne: 'admin' } }),
    IVFluid.countDocuments({ hospital, status: { $in: ['active', 'inactive', 'alert_low', 'alert_high'] } }),
    Task.countDocuments({ hospital, status: { $in: ['pending', 'in_progress'] } }),
  ]);
  return success(res, {
    data: { admittedPatients: patients, totalRooms: rooms, activeStaff: staff, activeIVBags: activeBags, pendingTasks },
  });
};

export default { responseTimes, complications, workload, taskCompletion, ivUsage, overview };
