import IVFluid from '../models/IVFluid.js';
import IVEventLog from '../models/IVEventLog.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import env from '../config/env.js';
import {
  calculateFluidLevel,
  gramsLostPerMs,
  estimateEmptyTime,
  classifyStatus,
} from './ivCalculationService.js';
import { broadcastIVUpdate, notifySMS } from './notificationService.js';
import { notifyUsers } from './notifyUsers.js';

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

      // Resolve the room's assigned doctors/nurses once - used to scope
      // every notification below so only their patients' staff (and their
      // hospital's admins) are notified.
      let roomStaffIds = [];
      let roomDoc = null;
      if (bag.room) {
        roomDoc = await Room.findById(bag.room._id).populate('assignedNurses assignedDoctors');
        roomStaffIds = [...(roomDoc?.assignedNurses || []), ...(roomDoc?.assignedDoctors || [])].map(
          (u) => u._id
        );
      }

      if (newStatus === 'completed' && previousStatus !== 'completed') {
        bag.endTime = new Date();
        await IVEventLog.create({
          hospital: bag.hospital,
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
          hospital: bag.hospital,
          ivFluid: bag._id,
          room: bag.room?._id,
          patient: bag.patient?._id,
          eventType: 'alert_triggered',
          details: { message, fluidLevel: bag.fluidLevel },
        });

        // Notify only the assigned nurses/doctors for that room (SMS + persisted
        // notification + live socket push, all scoped to this hospital).
        const staff = [...(roomDoc?.assignedNurses || []), ...(roomDoc?.assignedDoctors || [])];
        staff.forEach((member) => notifySMS(member, message));
        await notifyUsers({
          hospital: bag.hospital,
          userIds: roomStaffIds,
          type: newStatus,
          message,
          ivFluid: bag._id,
          patient: bag.patient?._id,
          room: bag.room?._id,
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
        const supervisors = await User.find({ role: 'admin', hospital: bag.hospital, isActive: true });
        const message = `ESCALATION: unacknowledged alert for ${bag.patient?.name || 'patient'} in room ${
          bag.room?.roomNumber || ''
        }`;
        supervisors.forEach((sup) => notifySMS(sup, message));
        await notifyUsers({
          hospital: bag.hospital,
          userIds: supervisors.map((s) => s._id),
          type: 'escalation',
          message,
          ivFluid: bag._id,
          patient: bag.patient?._id,
          room: bag.room?._id,
        });
      }

      await bag.save();
      broadcastIVUpdate(bag, roomStaffIds, bag.hospital);
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
