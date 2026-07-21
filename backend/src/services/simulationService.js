import IVFluid from '../models/IVFluid.js';
import IVEventLog from '../models/IVEventLog.js';
import Room from '../models/Room.js';
import env from '../config/env.js';
import {
  calculateFluidLevel,
  gramsLostPerMs,
  estimateEmptyTime,
  classifyStatus,
} from './ivCalculationService.js';
import {
  broadcastIVUpdate,
  broadcastAlert,
  notifyDashboard,
  notifySMS,
} from './notificationService.js';
import User from '../models/User.js';

let intervalHandle = null;

const tick = async () => {
  try {
    const activeBags = await IVFluid.find({
      status: { $in: ['active', 'alert_low', 'alert_high'] },
    }).populate('room patient');

    for (const bag of activeBags) {
      const elapsedMs = env.simulationTickMs;
      const gramsLost = gramsLostPerMs(bag.flowRate) * elapsedMs;
      const newWeight = Math.max(bag.emptyBagWeight, bag.currentWeight - gramsLost);
      bag.currentWeight = newWeight;
      bag.fluidLevel = calculateFluidLevel(bag);
      bag.estimatedEmptyTime = estimateEmptyTime(bag);

      const previousStatus = bag.status;
      const newStatus = bag.fluidLevel <= 0 ? 'completed' : classifyStatus(bag.fluidLevel);
      bag.status = newStatus;

      if (newStatus === 'completed' && previousStatus !== 'completed') {
        bag.endTime = new Date();
        await IVEventLog.create({
          ivFluid: bag._id,
          room: bag.room?._id,
          patient: bag.patient?._id,
          eventType: 'bag_removed',
          details: { reason: 'fluid depleted (simulated)' },
        });
      }

      // Raise a fresh alert when transitioning into a low/high state
      if ((newStatus === 'alert_low' || newStatus === 'alert_high') && previousStatus !== newStatus) {
        const message =
          newStatus === 'alert_low'
            ? `Low fluid level (${bag.fluidLevel}%) for ${bag.patient?.name || 'patient'} in room ${
                bag.room?.roomNumber || ''
              }`
            : `Fluid overload risk (${bag.fluidLevel}%) for ${bag.patient?.name || 'patient'} in room ${
                bag.room?.roomNumber || ''
              }`;

        bag.alerts.push({
          type: newStatus === 'alert_low' ? 'low' : 'high',
          message,
        });

        await IVEventLog.create({
          ivFluid: bag._id,
          room: bag.room?._id,
          patient: bag.patient?._id,
          eventType: 'alert_triggered',
          details: { message, fluidLevel: bag.fluidLevel },
        });

        // Notify assigned nurses/doctors for that room (dashboard + simulated SMS)
        if (bag.room) {
          const room = await Room.findById(bag.room._id).populate('assignedNurses assignedDoctors');
          const staff = [...(room?.assignedNurses || []), ...(room?.assignedDoctors || [])];
          staff.forEach((member) => {
            notifySMS(member, message);
          });
        }
        notifyDashboard({ message, type: newStatus, ivFluidId: bag._id });
        broadcastAlert({
          ivFluidId: bag._id,
          type: newStatus === 'alert_low' ? 'low' : 'high',
          message,
          fluidLevel: bag.fluidLevel,
          roomNumber: bag.room?.roomNumber,
          patientName: bag.patient?.name,
        });
      }

      // Escalate unacknowledged alerts past the escalation window
      const escalationMs = env.escalationMinutes * 60 * 1000;
      let escalatedSomething = false;
      bag.alerts.forEach((alert) => {
        if (
          !alert.acknowledged &&
          !alert.escalated &&
          Date.now() - new Date(alert.timestamp).getTime() > escalationMs
        ) {
          alert.escalated = true;
          alert.escalatedAt = new Date();
          escalatedSomething = true;
        }
      });

      if (escalatedSomething) {
        const supervisors = await User.find({ role: 'admin', isActive: true });
        const message = `ESCALATION: unacknowledged alert for ${bag.patient?.name || 'patient'} in room ${
          bag.room?.roomNumber || ''
        }`;
        supervisors.forEach((sup) => notifySMS(sup, message));
        notifyDashboard({ message, type: 'escalation', ivFluidId: bag._id });
      }

      await bag.save();
      broadcastIVUpdate(bag);
    }
  } catch (err) {
    console.error('[simulation] tick error:', err.message);
  }
};

export const startSimulation = () => {
  if (intervalHandle) return;
  intervalHandle = setInterval(tick, env.simulationTickMs);
  console.log(`[simulation] started, tick every ${env.simulationTickMs}ms`);
};

export const stopSimulation = () => {
  if (intervalHandle) clearInterval(intervalHandle);
  intervalHandle = null;
};

export const runTickNow = tick;

export default { startSimulation, stopSimulation, runTickNow };
