import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import * as notificationApi from '../../services/notificationApi.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { formatDateTime } from '../../utils/helpers.js';

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const { onAlert, onTaskUpdate } = useSocket();

  const load = () => {
    setLoading(true);
    notificationApi
      .getNotifications()
      .then(({ notifications, unreadCount: count }) => {
        setItems(notifications);
        setUnreadCount(count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Live events bump the unread count immediately; the canonical list
  // refreshes from the server next time the tray is opened.
  useEffect(() => {
    const unsubAlert = onAlert(() => setUnreadCount((c) => c + 1));
    const unsubTask = onTaskUpdate(() => setUnreadCount((c) => c + 1));
    return () => {
      unsubAlert();
      unsubTask();
    };
  }, [onAlert, onTaskUpdate]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const handleMarkRead = async (id) => {
    await notificationApi.markRead(id);
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={toggleOpen}
        className="relative rounded-lg p-2 text-ink/60 hover:bg-mist"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-crit px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[90vw] rounded-2xl border border-border/5 bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border/5 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && <p className="px-4 py-6 text-center text-sm text-ink/40">Loading…</p>}
            {!loading && !items.length && (
              <p className="px-4 py-6 text-center text-sm text-ink/40">No notifications yet.</p>
            )}
            {items.map((n) => (
              <div
                key={n._id}
                className={`flex items-start gap-2 border-b border-border/5 px-4 py-3 last:border-0 ${
                  !n.read ? 'bg-teal-50/40' : ''
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm text-ink">{n.message}</p>
                  <p className="mt-0.5 text-xs text-ink/40">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n._id)}
                    title="Mark as read"
                    className="mt-0.5 text-ink/30 hover:text-teal-600"
                  >
                    <Check size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
