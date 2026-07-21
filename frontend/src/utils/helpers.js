export const levelBand = (level) => {
  if (level < 10) return 'critical';
  if (level <= 20) return 'warning';
  if (level > 90) return 'critical';
  return 'normal';
};

export const bandColor = {
  normal: { bg: 'bg-good/10', text: 'text-good', dot: 'bg-good', ring: 'ring-good/30' },
  warning: { bg: 'bg-warn/10', text: 'text-warn', dot: 'bg-warn', ring: 'ring-warn/30' },
  critical: { bg: 'bg-crit/10', text: 'text-crit', dot: 'bg-crit', ring: 'ring-crit/30' },
};

export const roleLabel = {
  admin: 'Administrator',
  doctor: 'Doctor',
  nurse: 'Nurse',
  support_staff: 'Support Staff',
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatMinutes = (mins) => {
  if (mins === null || mins === undefined) return '—';
  if (mins < 60) return `${Math.round(mins)}m`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
};

export const timeUntil = (value) => {
  if (!value) return '—';
  const diffMs = new Date(value).getTime() - Date.now();
  if (diffMs <= 0) return 'due now';
  const mins = Math.round(diffMs / 60000);
  return formatMinutes(mins);
};

export default { levelBand, bandColor, roleLabel, formatDateTime, formatMinutes, timeUntil };
