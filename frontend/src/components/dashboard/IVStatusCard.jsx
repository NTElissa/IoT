import React from 'react';
import { Droplet, Clock, UserPlus, Check } from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import { levelBand, timeUntil } from '../../utils/helpers.js';

const IVStatusCard = ({ bag, onDelegate, onAcknowledge, canManage }) => {
  const band = levelBand(bag.fluidLevel);
  const unacknowledgedAlert = bag.alerts?.find((a) => !a.acknowledged);

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-sm font-semibold text-ink">{bag.patient?.name || 'Unknown patient'}</p>
          <p className="text-xs text-ink/50">
            Room {bag.room?.roomNumber || '—'} · Bed {bag.patient?.bed || '—'}
          </p>
        </div>
        <StatusBadge band={band} level={Math.round(bag.fluidLevel)} />
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-mist">
        <div
          className={`h-full rounded-full transition-all ${
            band === 'critical' ? 'bg-crit' : band === 'warning' ? 'bg-warn' : 'bg-good'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, bag.fluidLevel))}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink/50">
        <span className="flex items-center gap-1.5">
          <Droplet size={13} /> {bag.fluidType} · {bag.bagSize}ml
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={13} /> empty in {timeUntil(bag.estimatedEmptyTime)}
        </span>
      </div>

      {canManage && (unacknowledgedAlert || onDelegate) && (
        <div className="mt-4 flex gap-2">
          {unacknowledgedAlert && (
            <button
              onClick={() => onAcknowledge?.(bag, unacknowledgedAlert)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-ink/70 hover:bg-mist"
            >
              <Check size={14} /> Acknowledge
            </button>
          )}
          <button
            onClick={() => onDelegate?.(bag)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-medium text-white hover:bg-teal-700"
          >
            <UserPlus size={14} /> Delegate change
          </button>
        </div>
      )}
    </div>
  );
};

export default IVStatusCard;
