import mongoose from 'mongoose';

// One shared chat thread per patient - the doctor, nurse, any staff member
// with a delegated task for that patient, and the patient's own portal
// account (if enabled) can all read and post to it. Kept intentionally
// simple (no separate "conversation" document) since the thread's identity
// is just "this patient".
const messageSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true }, // snapshot, survives account changes
    senderRole: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ patient: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
