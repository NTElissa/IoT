import React from 'react';
import { BellRing, X, Radio } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.jsx';

const NotificationTray = () => {
  const { notifications, dismissNotification } = useSocket();

  if (!notifications.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {notifications.slice(0, 4).map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-teal-100 bg-white p-3 shadow-card"
        >
          <div className="mt-0.5 rounded-full bg-teal-50 p-1.5 text-teal-600">
            {n.channel === 'alert' ? <BellRing size={16} /> : <Radio size={16} />}
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium text-ink">{n.message || 'New update'}</p>
            {n.channel && <p className="mt-0.5 text-xs uppercase tracking-wide text-ink/40">{n.channel}</p>}
          </div>
          <button
            onClick={() => dismissNotification(n.id)}
            className="text-ink/30 hover:text-ink/60"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationTray;
