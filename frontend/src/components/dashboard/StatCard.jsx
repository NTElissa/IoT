import React from 'react';

const StatCard = ({ label, value, icon: Icon, tone = 'teal' }) => {
  const toneMap = {
    teal: 'bg-teal-50 text-teal-600',
    amber: 'bg-amber-400/10 text-amber-500',
    crit: 'bg-crit/10 text-crit',
    good: 'bg-good/10 text-good',
  };
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/40">{label}</p>
        {Icon && (
          <div className={`rounded-lg p-1.5 ${toneMap[tone]}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
};

export default StatCard;
