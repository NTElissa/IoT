import { sendSMS } from './smsProviderService.js';

// Simulated app-push / always-on dashboard channel, plus real (or
// gracefully-simulated) SMS via smsProviderService. Every broadcast is
// scoped to (a) the specific staff assigned to the relevant room/patient
// via `user:<id>` socket rooms, and (b) that hospital's admins via
// `hospital-admin:<hospitalId>` - never anyone outside that hospital.

let ioInstance = null;

export const attachIO = (io) => {
  ioInstance = io;
};

const emitScoped = (event, payload, targetUserIds, hospitalId) => {
  if (!ioInstance) return;
  const userRooms = (targetUserIds || []).map((id) => `user:${id.toString()}`);
  const rooms = [...new Set(userRooms)];
  if (hospitalId) rooms.push(`hospital-admin:${hospitalId.toString()}`);

  if (!rooms.length) return; // never broadcast globally - every event must be scoped

  ioInstance.to(rooms).emit(event, payload);
};

export const notifyDashboard = (payload, targetUserIds, hospitalId) => {
  emitScoped('notification', { channel: 'dashboard', ...payload }, targetUserIds, hospitalId);
};

export const notifySMS = (toUser, message) => {
  if (!toUser?.phone) return;
  // Fire-and-forget - never let an SMS failure block the request/response cycle.
  sendSMS({ to: toUser.phone, message }).catch(() => {});
  emitScoped('notification', { channel: 'sms', to: toUser?.name, message }, toUser?._id ? [toUser._id] : []);
};

export const notifyApp = (toUserId, payload) => {
  emitScoped('notification', { channel: 'app', to: toUserId, ...payload }, toUserId ? [toUserId] : []);
};

export const broadcastAlert = (alertPayload, targetUserIds, hospitalId) => {
  emitScoped('alert', alertPayload, targetUserIds, hospitalId);
};

export const broadcastIVUpdate = (ivFluid, targetUserIds, hospitalId) => {
  emitScoped('iv-update', ivFluid, targetUserIds, hospitalId);
};

export const broadcastTaskUpdate = (task, targetUserIds, hospitalId) => {
  emitScoped('task-update', task, targetUserIds, hospitalId);
};

export default {
  attachIO,
  notifyDashboard,
  notifySMS,
  notifyApp,
  broadcastAlert,
  broadcastIVUpdate,
  broadcastTaskUpdate,
};
