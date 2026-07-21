import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    ivFluid: { type: mongoose.Schema.Types.ObjectId, ref: 'IVFluid' },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    taskType: {
      type: String,
      enum: ['bag_change', 'bag_removal', 'check_flow', 'other'],
      default: 'bag_change',
    },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'escalated'],
      default: 'pending',
    },
    completedAt: { type: Date },
    escalatedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
