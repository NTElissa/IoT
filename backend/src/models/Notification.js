import mongoose from 'mongoose';

// Persisted per-user notifications, so the bell icon can show an unread
// count and a history even after the socket connection was offline when the
// event happened. Doctors/nurses only ever get notifications tied to
// patients/rooms they're assigned to (enforced by the caller, not here).
const notificationSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['alert_low', 'alert_high', 'escalation', 'task_assigned', 'task_completed', 'task_escalated', 'system'],
      required: true,
    },
    message: { type: String, required: true },
    ivFluid: { type: mongoose.Schema.Types.ObjectId, ref: 'IVFluid' },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
