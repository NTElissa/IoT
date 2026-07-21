import mongoose from 'mongoose';

const ivEventLogSchema = new mongoose.Schema(
  {
    ivFluid: { type: mongoose.Schema.Types.ObjectId, ref: 'IVFluid' },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    eventType: {
      type: String,
      enum: [
        'bag_hung',
        'bag_changed',
        'bag_removed',
        'alert_triggered',
        'alert_acknowledged',
        'task_assigned',
        'task_completed',
        'task_escalated',
        'complication_recorded',
      ],
      required: true,
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    details: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model('IVEventLog', ivEventLogSchema);
