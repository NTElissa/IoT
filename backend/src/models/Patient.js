import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['M', 'F', 'Other'], required: true },
    contact: { type: String, trim: true },
    medicalHistory: { type: String, trim: true },
    // Known allergies - surfaced prominently wherever this patient's chart
    // is shown, especially before adding IV fluids or medications.
    allergies: [{ type: String, trim: true }],
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    bed: { type: String, trim: true },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedNurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['admitted', 'discharged'], default: 'admitted' },
    admittedAt: { type: Date, default: Date.now },
    dischargedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Patient portal: a short, globally-unique code the patient uses to log
    // in themselves (in place of an email address), plus a link to the
    // portal account once one has been created for them.
    patientCode: { type: String, unique: true, sparse: true, index: true },
    portalEnabled: { type: Boolean, default: false },
    portalUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Patient', patientSchema);
