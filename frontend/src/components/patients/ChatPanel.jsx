import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Spinner, ErrorState } from '../common/ui.jsx';
import * as chatService from '../../services/chatService.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDateTime, roleLabel } from '../../utils/helpers.js';

// A single shared chat thread for one patient - used both from the staff
// side (Patients page "Chat" button) and from the patient's own portal.
const ChatPanel = ({ patientId }) => {
  const { user } = useAuth();
  const { onChatMessage } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    chatService
      .getMessages(patientId)
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    chatService.markMessagesRead(patientId).catch(() => {});
  }, [patientId]);

  useEffect(() => {
    const unsubscribe = onChatMessage((message) => {
      if (message.patient !== patientId && message.patient?._id !== patientId) return;
      setMessages((prev) => [...prev, message]);
    });
    return unsubscribe;
  }, [onChatMessage, patientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await chatService.sendMessage(patientId, text.trim());
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex h-full flex-col">
      {error && <ErrorState message={error} />}
      <div className="mb-3 max-h-80 flex-1 space-y-2 overflow-y-auto rounded-lg bg-mist p-3">
        {!messages.length && <p className="text-center text-sm text-ink/40">No messages yet - say hello.</p>}
        {messages.map((m) => {
          const mine = (m.sender?._id || m.sender) === user._id;
          return (
            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  mine ? 'bg-teal-600 text-white' : 'bg-surface text-ink shadow-card'
                }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-xs font-medium text-ink/40">
                    {m.senderName} · {roleLabel[m.senderRole] || m.senderRole}
                  </p>
                )}
                <p>{m.text}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-ink/30'}`}>
                  {formatDateTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-border/10 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="flex items-center justify-center rounded-lg bg-teal-600 px-3 py-2 text-white hover:bg-teal-700 disabled:opacity-60"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
