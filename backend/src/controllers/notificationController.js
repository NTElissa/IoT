import Notification from '../models/Notification.js';
import { success, failure } from '../utils/apiResponse.js';

export const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .populate('patient', 'name')
    .populate('room', 'roomNumber')
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
  return success(res, { data: { notifications, unreadCount } });
};

export const markRead = async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) return failure(res, { message: 'Notification not found', status: 404 });
  notification.read = true;
  notification.readAt = new Date();
  await notification.save();
  return success(res, { message: 'Notification marked as read', data: notification });
};

export const markAllRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
  return success(res, { message: 'All notifications marked as read' });
};

export default { getNotifications, markRead, markAllRead };
