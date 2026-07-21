import env from '../config/env.js';

// Fluid Level (%) = (Current Weight - Empty Bag Weight) / (Full Bag Weight - Empty Bag Weight) x 100
export const calculateFluidLevel = ({ currentWeight, emptyBagWeight, initialWeight }) => {
  const range = initialWeight - emptyBagWeight;
  if (range <= 0) return 0;
  const level = ((currentWeight - emptyBagWeight) / range) * 100;
  return Math.max(0, Math.min(100, Math.round(level * 10) / 10));
};

// Given a flow rate (ml/hour), estimate how many grams are lost per simulation tick.
// Assumes 1ml ~= 1g for aqueous IV fluids.
export const gramsLostPerMs = (flowRateMlPerHour) => {
  const mlPerMs = flowRateMlPerHour / (60 * 60 * 1000);
  return mlPerMs; // 1ml ~= 1g
};

export const estimateEmptyTime = ({ currentWeight, emptyBagWeight, flowRate }) => {
  const remainingMl = Math.max(0, currentWeight - emptyBagWeight);
  if (flowRate <= 0) return null;
  const hoursRemaining = remainingMl / flowRate;
  return new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);
};

export const classifyStatus = (fluidLevel) => {
  if (fluidLevel < env.lowThreshold) return 'alert_low';
  if (fluidLevel > env.highThreshold) return 'alert_high';
  return 'active';
};

export const levelBand = (fluidLevel) => {
  if (fluidLevel < env.lowThreshold) return 'critical';
  if (fluidLevel <= env.warningThreshold) return 'warning';
  if (fluidLevel > env.highThreshold) return 'critical';
  return 'normal';
};

export default {
  calculateFluidLevel,
  gramsLostPerMs,
  estimateEmptyTime,
  classifyStatus,
  levelBand,
};
