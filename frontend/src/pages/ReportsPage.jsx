import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import AppLayout from '../components/common/AppLayout.jsx';
import { Card, ErrorState, Spinner } from '../components/common/ui.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import { Timer, Activity, Users, Droplet } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import * as reportService from '../services/reportService.js';

const PIE_COLORS = ['#0F5C5C', '#2B7A9B', '#E8A33D', '#D64545'];

const ReportsPage = () => {
  const { user } = useAuth();
  const [responseTimes, setResponseTimes] = useState(null);
  const [complications, setComplications] = useState(null);
  const [workload, setWorkload] = useState(null);
  const [taskCompletion, setTaskCompletion] = useState(null);
  const [ivUsage, setIvUsage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calls = [reportService.getComplications().then(setComplications)];
    if (user.role === 'admin') {
      calls.push(
        reportService.getResponseTimes().then(setResponseTimes),
        reportService.getWorkload().then(setWorkload),
        reportService.getTaskCompletion().then(setTaskCompletion),
        reportService.getIVUsage().then(setIvUsage)
      );
    }
    Promise.all(calls)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title="Reports">
        <Spinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Reports">
      {error && <ErrorState message={error} />}

      {responseTimes && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Avg. response time" value={`${responseTimes.averageResponseMinutes}m`} icon={Timer} />
          <StatCard label="Tasks completed" value={responseTimes.totalCompletedTasks} icon={Activity} tone="good" />
          <StatCard label="Escalated tasks" value={responseTimes.escalatedTaskCount} icon={Users} tone="crit" />
          <StatCard label="IV complication rate" value={`${complications?.complicationRatePercent ?? 0}%`} icon={Droplet} tone="amber" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {taskCompletion && (
          <Card>
            <h3 className="mb-4 font-display text-base font-semibold text-ink">Task completion status</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pending', value: taskCompletion.pending },
                    { name: 'In progress', value: taskCompletion.in_progress },
                    { name: 'Completed', value: taskCompletion.completed },
                    { name: 'Escalated', value: taskCompletion.escalated },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {PIE_COLORS.map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <p className="mt-2 text-center text-sm text-ink/50">
              {taskCompletion.completionRatePercent}% completion rate ({taskCompletion.total} total tasks)
            </p>
          </Card>
        )}

        {ivUsage && (
          <Card>
            <h3 className="mb-4 font-display text-base font-semibold text-ink">IV fluid usage by type</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ivUsage.byType.map((d) => ({ name: d._id, count: d.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0B202710" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0F5C5C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {workload && (
          <Card className="lg:col-span-2">
            <h3 className="mb-4 font-display text-base font-semibold text-ink">Nurse workload</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={workload}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0B202710" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="tasksDelegated" name="Tasks delegated" fill="#2B7A9B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="activePatients" name="Active patients" fill="#E8A33D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {complications && (
          <Card className="lg:col-span-2">
            <h3 className="mb-4 font-display text-base font-semibold text-ink">Recorded complications</h3>
            {complications.records.length === 0 ? (
              <p className="text-sm text-ink/50">No complications recorded.</p>
            ) : (
              <div className="space-y-2">
                {complications.records.slice(0, 8).map((r) => (
                  <div key={r._id} className="rounded-lg bg-mist px-3 py-2 text-sm">
                    <p className="font-medium text-ink">
                      {r.patient?.name || 'Unknown patient'} · Room {r.room?.roomNumber || '—'}
                    </p>
                    <p className="text-ink/60">{r.details?.description}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
