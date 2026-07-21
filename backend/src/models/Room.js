import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    ward: { type: String, required: true, trim: true },
    bedCount: { type: Number, required: true, default: 1, min: 1 },
    assignedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedNurses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Room', roomSchema);
