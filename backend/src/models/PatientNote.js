import mongoose from 'mongoose';

// A note on a patient's chart - either a free-text comment or a structured
// medication/drug entry. Only the assigned doctor/nurse (or an admin) may
// add or view these - enforced by the controller, not here.
const patientNoteSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['comment', 'medication'], required: true, default: 'comment' },
    text: { type: String, trim: true },
    // Only used when type === 'medication'
    drugName: { type: String, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    instructions: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('PatientNote', patientNoteSchema);
