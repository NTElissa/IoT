import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['M', 'F', 'Other'], required: true },
    contact: { type: String, trim: true },
    medicalHistory: { type: String, trim: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    bed: { type: String, trim: true },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedNurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['admitted', 'discharged'], default: 'admitted' },
    admittedAt: { type: Date, default: Date.now },
    dischargedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Patient', patientSchema);
