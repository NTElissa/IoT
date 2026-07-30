import Task from '../models/Task.js';
import IVEventLog from '../models/IVEventLog.js';
import User from '../models/User.js';
import { notifySMS, notifyApp, broadcastTaskUpdate } from '../services/notificationService.js';
import { notifyUsers } from '../services/notifyUsers.js';
import { success, failure } from '../utils/apiResponse.js';

export const getTasks = async (req, res) => {
  const filter = { hospital: req.user.hospital };
  if (req.user.role === 'staff') filter.assignedTo = req.user._id;
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

// Delegate a task (e.g. bag change) to a staff member
export const createTask = async (req, res) => {
  const { assignedTo, taskType, description, ivFluid, room, patient } = req.body;
  if (!assignedTo || !taskType) {
    return failure(res, { message: 'assignedTo and taskType are required', status: 400 });
  }
  const staffMember = await User.findOne({ _id: assignedTo, hospital: req.user.hospital });
  if (!staffMember || staffMember.role !== 'staff') {
    return failure(res, { message: 'assignedTo must be an active staff member in your hospital', status: 400 });
  }

  const task = await Task.create({
    hospital: req.user.hospital,
    ivFluid,
    room,
    patient,
    assignedBy: req.user._id,
    assignedTo,
    taskType,
    description,
  });

  await IVEventLog.create({
    hospital: req.user.hospital,
    ivFluid,
    room,
    patient,
    eventType: 'task_assigned',
    performedBy: req.user._id,
    details: { assignedTo, taskType },
  });

  const populated = await task.populate(['assignedBy', 'assignedTo', 'room', 'patient', 'ivFluid']);
  const message = `New task: ${taskType.replace('_', ' ')} in room ${populated.room?.roomNumber || ''}`;
  notifySMS(staffMember, message);
  notifyApp(staffMember._id, { message: 'New task assigned', taskId: task._id });
  await notifyUsers({
    hospital: req.user.hospital,
    userIds: [staffMember._id],
    type: 'task_assigned',
    message,
    task: task._id,
    room,
    patient,
  });
  broadcastTaskUpdate(populated, [populated.assignedTo._id, populated.assignedBy._id], req.user.hospital);

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
  const task = await Task.findOne({ _id: req.params.id, hospital: req.user.hospital }).populate(
    'room patient ivFluid assignedTo assignedBy'
  );
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
    hospital: req.user.hospital,
    ivFluid: task.ivFluid?._id,
    room: task.room?._id,
    patient: task.patient?._id,
    eventType: status === 'completed' ? 'task_completed' : status === 'escalated' ? 'task_escalated' : 'task_assigned',
    performedBy: req.user._id,
  });

  if (status === 'completed' || status === 'escalated') {
    await notifyUsers({
      hospital: req.user.hospital,
      userIds: [task.assignedBy?._id, task.assignedTo?._id].filter(Boolean),
      type: status === 'completed' ? 'task_completed' : 'task_escalated',
      message: `Task ${status.replace('_', ' ')}: ${task.taskType.replace('_', ' ')} in room ${task.room?.roomNumber || ''}`,
      task: task._id,
      room: task.room?._id,
      patient: task.patient?._id,
    });
  }

  broadcastTaskUpdate(task, [task.assignedTo?._id, task.assignedBy?._id].filter(Boolean), req.user.hospital);
  return success(res, { message: 'Task updated', data: task });
};

export const completeTask = async (req, res) => {
  req.body.status = 'completed';
  return updateTaskStatus(req, res);
};

export const escalateTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, hospital: req.user.hospital }).populate('room patient');
  if (!task) return failure(res, { message: 'Task not found', status: 404 });
  task.status = 'escalated';
  task.escalatedAt = new Date();
  await task.save();

  const supervisors = await User.find({ role: 'admin', hospital: req.user.hospital, isActive: true });
  const message = `Task escalated: ${task.taskType.replace('_', ' ')} in room ${task.room?.roomNumber || ''}`;
  supervisors.forEach((sup) => notifySMS(sup, message));
  await notifyUsers({
    hospital: req.user.hospital,
    userIds: supervisors.map((s) => s._id),
    type: 'task_escalated',
    message,
    task: task._id,
    room: task.room?._id,
    patient: task.patient?._id,
  });

  broadcastTaskUpdate(
    task,
    [task.assignedTo?.toString?.(), task.assignedBy?.toString?.()].filter(Boolean),
    req.user.hospital
  );
  return success(res, { message: 'Task escalated', data: task });
};

export default { getTasks, createTask, updateTaskStatus, completeTask, escalateTask };
