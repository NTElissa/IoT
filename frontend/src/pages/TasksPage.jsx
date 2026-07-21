import React, { useEffect, useState } from 'react';
import { ClipboardList, Check, ArrowUpCircle } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import { Card, EmptyState, ErrorState, Spinner } from '../components/common/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import * as taskService from '../services/taskService.js';
import { formatDateTime } from '../utils/helpers.js';

const statusColor = {
  pending: 'bg-ink/5 text-ink/50',
  in_progress: 'bg-sky-500/10 text-sky-600',
  completed: 'bg-good/10 text-good',
  escalated: 'bg-crit/10 text-crit',
};

const TasksPage = () => {
  const { user } = useAuth();
  const { onTaskUpdate } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    taskService
      .getTasks()
      .then(setTasks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    const unsubscribe = onTaskUpdate((updated) => {
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t._id === updated._id);
        if (idx === -1) return [updated, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...updated };
        return next;
      });
    });
    return unsubscribe;
  }, [onTaskUpdate]);

  const canAct = (task) =>
    user.role === 'admin' ||
    task.assignedTo?._id === user._id ||
    task.assignedBy?._id === user._id;

  const setInProgress = async (task) => {
    await taskService.updateTaskStatus(task._id, { status: 'in_progress' });
  };
  const complete = async (task) => {
    await taskService.completeTask(task._id);
  };
  const escalate = async (task) => {
    await taskService.escalateTask(task._id);
  };

  return (
    <AppLayout title={user.role === 'support_staff' ? 'My Tasks' : 'Tasks'}>
      <p className="mb-4 text-sm text-ink/50">
        {user.role === 'support_staff'
          ? 'Bag changes and other tasks delegated to you.'
          : 'Tasks you have delegated to support staff.'}
      </p>

      {loading && <Spinner />}
      {error && <ErrorState message={error} />}

      {!loading && !tasks.length && (
        <EmptyState icon={ClipboardList} title="No tasks yet" description="Delegated tasks will show up here." />
      )}

      {!loading && tasks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task._id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-sm font-semibold text-ink">
                    {task.taskType.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-ink/50">
                    {task.patient?.name} · Room {task.room?.roomNumber}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[task.status]}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              {task.description && <p className="mt-2 text-sm text-ink/60">{task.description}</p>}
              <div className="mt-3 space-y-1 text-xs text-ink/40">
                <p>Assigned to: {task.assignedTo?.name}</p>
                <p>Assigned by: {task.assignedBy?.name}</p>
                <p>Created: {formatDateTime(task.createdAt)}</p>
                {task.completedAt && <p>Completed: {formatDateTime(task.completedAt)}</p>}
              </div>

              {canAct(task) && task.status !== 'completed' && task.status !== 'escalated' && (
                <div className="mt-4 flex gap-2">
                  {task.status === 'pending' && (
                    <button
                      onClick={() => setInProgress(task)}
                      className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-ink/70 hover:bg-mist"
                    >
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => complete(task)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-medium text-white hover:bg-teal-700"
                  >
                    <Check size={13} /> Complete
                  </button>
                  {user.role !== 'support_staff' && (
                    <button
                      onClick={() => escalate(task)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-crit/20 px-3 py-2 text-xs font-medium text-crit hover:bg-crit/5"
                      title="Escalate"
                    >
                      <ArrowUpCircle size={13} />
                    </button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default TasksPage;
