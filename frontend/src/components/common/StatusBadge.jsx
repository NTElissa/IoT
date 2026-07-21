import React from 'react';
import { bandColor } from '../../utils/helpers.js';

const LABELS = { normal: 'Normal', warning: 'Warning', critical: 'Critical' };

const StatusBadge = ({ band, level }) => {
  const c = bandColor[band] || bandColor.normal;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot} ${band === 'critical' ? 'animate-pulse-slow' : ''}`} />
      {LABELS[band]}
      {typeof level === 'number' && <span className="font-mono-data">{level}%</span>}
    </span>
  );
};

export default StatusBadge;
