// Simulated notification channels. In a production deployment these would
// call a real SMS gateway (e.g. Twilio / a Rwandan telco API) and a push
// notification service. Here we log them and always emit to the dashboard
// over Socket.IO so the behaviour is fully demonstrable offline.

let ioInstance = null;

export const attachIO = (io) => {
  ioInstance = io;
};

const emit = (event, payload) => {
  if (ioInstance) {
    ioInstance.emit(event, payload);
  }
};

export const notifyDashboard = (payload) => {
  emit('notification', { channel: 'dashboard', ...payload });
};

export const notifySMS = (toUser, message) => {
  // Simulated SMS - logged to console, would be a real gateway call in production
  console.log(`[sms-sim] -> ${toUser?.phone || 'unknown number'}: ${message}`);
  emit('notification', { channel: 'sms', to: toUser?.name, message });
};

export const notifyApp = (toUserId, payload) => {
  emit('notification', { channel: 'app', to: toUserId, ...payload });
};

export const broadcastAlert = (alertPayload) => {
  emit('alert', alertPayload);
};

export const broadcastIVUpdate = (ivFluid) => {
  emit('iv-update', ivFluid);
};

export const broadcastTaskUpdate = (task) => {
  emit('task-update', task);
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
