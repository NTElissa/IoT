import mongoose from 'mongoose';

const alertSubSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['low', 'high'], required: true },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
    escalated: { type: Boolean, default: false },
    escalatedAt: { type: Date },
  },
  { _id: true }
);

const ivFluidSchema = new mongoose.Schema(
  {
    fluidType: {
      type: String,
      enum: ['Normal Saline', '5% Dextrose', "Ringer's Lactate", 'Other'],
      required: true,
    },
    bagSize: { type: Number, enum: [250, 500, 1000], required: true },
    emptyBagWeight: { type: Number, required: true, default: 30 }, // grams
    initialWeight: { type: Number, required: true }, // grams, full bag + empty bag
    currentWeight: { type: Number, required: true }, // grams
    flowRate: { type: Number, required: true, default: 150 }, // ml/hour
    fluidLevel: { type: Number, required: true, default: 100 }, // percent, derived
    status: {
      type: String,
      enum: ['active', 'completed', 'alert_low', 'alert_high', 'removed'],
      default: 'active',
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    estimatedEmptyTime: { type: Date },
    alerts: [alertSubSchema],
  },
  { timestamps: true }
);

// Weight-Based Monitoring Model:
// Fluid Level (%) = (Current Weight - Empty Bag Weight) / (Full Bag Weight - Empty Bag Weight) x 100
ivFluidSchema.methods.recalculateLevel = function recalculateLevel() {
  const fullBagWeight = this.initialWeight;
  const range = fullBagWeight - this.emptyBagWeight;
  if (range <= 0) {
    this.fluidLevel = 0;
    return this.fluidLevel;
  }
  const level = ((this.currentWeight - this.emptyBagWeight) / range) * 100;
  this.fluidLevel = Math.max(0, Math.min(100, Math.round(level * 10) / 10));
  return this.fluidLevel;
};

export default mongoose.model('IVFluid', ivFluidSchema);
