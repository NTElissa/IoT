import Task from '../models/Task.js';
import IVFluid from '../models/IVFluid.js';
import IVEventLog from '../models/IVEventLog.js';
import Patient from '../models/Patient.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import { success } from '../utils/apiResponse.js';

// Average time between task creation and completion, in minutes
export const responseTimes = async (req, res) => {
  const completed = await Task.find({ status: 'completed', completedAt: { $ne: null } });
  const durationsMin = completed.map(
    (t) => (new Date(t.completedAt) - new Date(t.createdAt)) / 60000
  );
  const avg = durationsMin.length
    ? Math.round((durationsMin.reduce((a, b) => a + b, 0) / durationsMin.length) * 10) / 10
    : 0;
  const escalatedCount = await Task.countDocuments({ status: 'escalated' });

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
  const logs = await IVEventLog.find({ eventType: 'complication_recorded' })
    .populate('patient', 'name')
    .populate('room', 'roomNumber')
    .sort({ createdAt: -1 });

  const totalBags = await IVFluid.countDocuments();
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
  const nurses = await User.find({ role: 'nurse', isActive: true });
  const results = [];
  for (const nurse of nurses) {
    const taskCount = await Task.countDocuments({ assignedBy: nurse._id });
    const roomCount = await Room.countDocuments({ assignedNurses: nurse._id });
    const patientCount = await Patient.countDocuments({ assignedNurse: nurse._id, status: 'admitted' });
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
  const statuses = ['pending', 'in_progress', 'completed', 'escalated'];
  const counts = {};
  for (const s of statuses) {
    counts[s] = await Task.countDocuments({ status: s });
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const completionRate = total ? Math.round((counts.completed / total) * 1000) / 10 : 0;
  return success(res, { data: { ...counts, total, completionRatePercent: completionRate } });
};

export const ivUsage = async (req, res) => {
  const byType = await IVFluid.aggregate([
    { $group: { _id: '$fluidType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const byStatus = await IVFluid.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const totalAlerts = await IVFluid.aggregate([
    { $unwind: '$alerts' },
    { $group: { _id: '$alerts.type', count: { $sum: 1 } } },
  ]);
  return success(res, { data: { byType, byStatus, alerts: totalAlerts } });
};

export const overview = async (req, res) => {
  const [patients, rooms, staff, activeBags, pendingTasks] = await Promise.all([
    Patient.countDocuments({ status: 'admitted' }),
    Room.countDocuments(),
    User.countDocuments({ isActive: true, role: { $ne: 'admin' } }),
    IVFluid.countDocuments({ status: { $in: ['active', 'alert_low', 'alert_high'] } }),
    Task.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
  ]);
  return success(res, {
    data: { admittedPatients: patients, totalRooms: rooms, activeStaff: staff, activeIVBags: activeBags, pendingTasks },
  });
};

export default { responseTimes, complications, workload, taskCompletion, ivUsage, overview };
