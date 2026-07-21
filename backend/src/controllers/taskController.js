import Task from '../models/Task.js';
import IVEventLog from '../models/IVEventLog.js';
import User from '../models/User.js';
import { notifySMS, notifyApp, broadcastTaskUpdate } from '../services/notificationService.js';
import { success, failure } from '../utils/apiResponse.js';

export const getTasks = async (req, res) => {
  const filter = {};
  if (req.user.role === 'support_staff') filter.assignedTo = req.user._id;
  if (req.user.role === 'nurse' || req.user.role === 'doctor') filter.assignedBy = req.user._id;
  const { status } = req.query;
  if (status) filter.status = status;

  const tasks = await Task.find(filter)
    .populate('assignedBy', 'name role')
    .populate('assignedTo', 'name role phone')
    .populate('room', 'roomNumber ward')
    .populate('patient', 'name bed')
    .populate('ivFluid', 'fluidType fluidLevel')
    .sort({ createdAt: -1 });
  return success(res, { data: tasks });
};

// Delegate a task (e.g. bag change) to a support staff member
export const createTask = async (req, res) => {
  const { assignedTo, taskType, description, ivFluid, room, patient } = req.body;
  if (!assignedTo || !taskType) {
    return failure(res, { message: 'assignedTo and taskType are required', status: 400 });
  }
  const staff = await User.findById(assignedTo);
  if (!staff || staff.role !== 'support_staff') {
    return failure(res, { message: 'assignedTo must be an active support staff member', status: 400 });
  }

  const task = await Task.create({
    ivFluid,
    room,
    patient,
    assignedBy: req.user._id,
    assignedTo,
    taskType,
    description,
  });

  await IVEventLog.create({
    ivFluid,
    room,
    patient,
    eventType: 'task_assigned',
    performedBy: req.user._id,
    details: { assignedTo, taskType },
  });

  const populated = await task.populate(['assignedBy', 'assignedTo', 'room', 'patient', 'ivFluid']);
  notifySMS(staff, `New task: ${taskType} in room ${populated.room?.roomNumber || ''}`);
  notifyApp(staff._id, { message: 'New task assigned', taskId: task._id });
  broadcastTaskUpdate(populated);

  return success(res, { message: 'Task delegated', data: populated, status: 201 });
};

const canModifyTask = (user, task) => {
  if (user.role === 'admin') return true;
  if (task.assignedTo.toString() === user._id.toString()) return true;
  if (task.assignedBy.toString() === user._id.toString()) return true;
  return false;
};

export const updateTaskStatus = async (req, res) => {
  const { status, notes } = req.body;
  const task = await Task.findById(req.params.id).populate('room patient ivFluid assignedTo assignedBy');
  if (!task) return failure(res, { message: 'Task not found', status: 404 });
  if (!canModifyTask(req.user, task)) {
    return failure(res, { message: 'Not authorized to update this task', status: 403 });
  }

  if (status) task.status = status;
  if (notes !== undefined) task.notes = notes;
  if (status === 'completed') task.completedAt = new Date();
  if (status === 'escalated') task.escalatedAt = new Date();

  await task.save();

  await IVEventLog.create({
    ivFluid: task.ivFluid?._id,
    room: task.room?._id,
    patient: task.patient?._id,
    eventType: status === 'completed' ? 'task_completed' : status === 'escalated' ? 'task_escalated' : 'task_assigned',
    performedBy: req.user._id,
  });

  broadcastTaskUpdate(task);
  return success(res, { message: 'Task updated', data: task });
};

export const completeTask = async (req, res) => {
  req.body.status = 'completed';
  return updateTaskStatus(req, res);
};

export const escalateTask = async (req, res) => {
  const task = await Task.findById(req.params.id).populate('room patient');
  if (!task) return failure(res, { message: 'Task not found', status: 404 });
  task.status = 'escalated';
  task.escalatedAt = new Date();
  await task.save();

  const supervisors = await User.find({ role: 'admin', isActive: true });
  const message = `Task escalated: ${task.taskType} in room ${task.room?.roomNumber || ''}`;
  supervisors.forEach((sup) => notifySMS(sup, message));

  broadcastTaskUpdate(task);
  return success(res, { message: 'Task escalated', data: task });
};

export default { getTasks, createTask, updateTaskStatus, completeTask, escalateTask };
