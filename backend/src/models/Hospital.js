import mongoose from 'mongoose';

// A hospital (tenant/organization). Created only by a super_admin, who also
// creates that hospital's first admin account at the same time. Every
// hospital-scoped document (users other than super_admin, rooms, patients,
// IV fluids, tasks, event logs, notifications) carries a `hospital` ref so
// data from one hospital is never visible to another.
const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Hospital', hospitalSchema);
