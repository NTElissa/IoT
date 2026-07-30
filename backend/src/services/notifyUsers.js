import Notification from '../models/Notification.js';
import { notifyDashboard } from './notificationService.js';

// Creates a persisted Notification for each target user and pushes a live
// socket event to them (the socket layer already scopes delivery to each
// user's own room + the admin room - see sockets/index.js). This is the
// single place that should be used to notify staff about IV/task events so
// the bell icon, unread count, and live toast all stay in sync.
export const notifyUsers = async ({ hospital, userIds, type, message, ivFluid, task, patient, room }) => {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean).map((id) => id.toString()))];
  if (!uniqueIds.length) return [];

  const docs = await Notification.insertMany(
    uniqueIds.map((user) => ({ hospital, user, type, message, ivFluid, task, patient, room }))
  );

  notifyDashboard({ message, type }, uniqueIds, hospital);
  return docs;
};

export default notifyUsers;
