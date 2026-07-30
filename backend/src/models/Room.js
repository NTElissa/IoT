import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    roomNumber: { type: String, required: true, trim: true },
    ward: { type: String, required: true, trim: true },
    bedCount: { type: Number, required: true, default: 1, min: 1 },
    assignedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedNurses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Room numbers only need to be unique within a hospital, not globally.
roomSchema.index({ hospital: 1, roomNumber: 1 }, { unique: true });

export default mongoose.model('Room', roomSchema);
