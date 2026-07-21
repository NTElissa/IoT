import React from 'react';
import { Inbox, AlertTriangle } from 'lucide-react';

export const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-black/5 bg-white p-5 shadow-card ${className}`}>{children}</div>
);

export const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-14 text-center">
    <div className="mb-3 rounded-full bg-teal-50 p-3 text-teal-500">
      <Icon size={22} />
    </div>
    <p className="font-display text-base font-semibold text-ink">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-ink/50">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ message }) => (
  <div className="flex items-center gap-3 rounded-xl border border-crit/20 bg-crit/5 px-4 py-3 text-sm text-crit">
    <AlertTriangle size={18} />
    {message || 'Something went wrong. Please try again.'}
  </div>
);

export const Spinner = ({ className = '' }) => (
  <div className={`h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent ${className}`} />
);

export default { Card, EmptyState, ErrorState, Spinner };
