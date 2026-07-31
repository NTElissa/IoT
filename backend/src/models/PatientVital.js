import mongoose from 'mongoose';

// A single vitals reading logged by a doctor or nurse - the trend over time
// (not just the latest value) is what actually helps catch deterioration
// early, so these are kept as an append-only log rather than fields on the
// patient record.
const patientVitalSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    temperatureC: { type: Number },
    heartRate: { type: Number }, // bpm
    respiratoryRate: { type: Number }, // breaths/min
    bloodPressureSystolic: { type: Number },
    bloodPressureDiastolic: { type: Number },
    oxygenSaturation: { type: Number }, // percent
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

patientVitalSchema.index({ patient: 1, createdAt: -1 });

export default mongoose.model('PatientVital', patientVitalSchema);
