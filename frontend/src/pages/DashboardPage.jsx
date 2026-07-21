import React, { useEffect, useState } from 'react';
import { Users, BedDouble, Droplet, ClipboardList, AlertTriangle } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import IVStatusCard from '../components/dashboard/IVStatusCard.jsx';
import DelegateTaskModal from '../components/dashboard/DelegateTaskModal.jsx';
import { Card, EmptyState, ErrorState, Spinner } from '../components/common/ui.jsx';
import useLiveIVFluids from '../hooks/useLiveIVFluids.js';
import { useAuth } from '../context/AuthContext.jsx';
import * as reportService from '../services/reportService.js';
import * as ivFluidService from '../services/ivFluidService.js';
import { levelBand } from '../utils/helpers.js';

const DashboardPage = () => {
  const { user } = useAuth();
  const { bags, loading, error, setBags } = useLiveIVFluids();
  const [overview, setOverview] = useState(null);
  const [delegateBag, setDelegateBag] = useState(null);

  useEffect(() => {
    reportService.getOverview().then(setOverview).catch(() => {});
  }, []);

  const canManage = ['admin', 'nurse', 'doctor'].includes(user.role);

  const handleAcknowledge = async (bag, alert) => {
    const updated = await ivFluidService.acknowledgeAlert(bag._id, alert._id);
    setBags((prev) => prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b)));
  };

  const critical = bags.filter((b) => levelBand(b.fluidLevel) === 'critical');
  const others = bags.filter((b) => levelBand(b.fluidLevel) !== 'critical');

  return (
    <AppLayout title={`Welcome, ${user.name.split(' ')[0]}`}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Admitted patients" value={overview?.admittedPatients ?? '—'} icon={Users} />
        <StatCard label="Rooms" value={overview?.totalRooms ?? '—'} icon={BedDouble} tone="amber" />
        <StatCard label="Active IV bags" value={overview?.activeIVBags ?? '—'} icon={Droplet} tone="good" />
        <StatCard label="Pending tasks" value={overview?.pendingTasks ?? '—'} icon={ClipboardList} tone="crit" />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            {user.role === 'support_staff' ? 'IV bags in monitored rooms' : 'Live IV monitoring'}
          </h2>
          {loading && <Spinner />}
        </div>

        {error && <ErrorState message={error} />}

        {!loading && !bags.length && !error && (
          <EmptyState
            icon={Droplet}
            title="No active IV bags yet"
            description="Once IV fluids are started for your assigned rooms, they'll appear here in real time."
          />
        )}

        {critical.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-crit">
              <AlertTriangle size={15} /> Needs attention
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {critical.map((bag) => (
                <IVStatusCard
                  key={bag._id}
                  bag={bag}
                  canManage={canManage}
                  onDelegate={setDelegateBag}
                  onAcknowledge={handleAcknowledge}
                />
              ))}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {others.map((bag) => (
              <IVStatusCard
                key={bag._id}
                bag={bag}
                canManage={canManage}
                onDelegate={setDelegateBag}
                onAcknowledge={handleAcknowledge}
              />
            ))}
          </div>
        )}
      </div>

      <DelegateTaskModal bag={delegateBag} onClose={() => setDelegateBag(null)} />
    </AppLayout>
  );
};

export default DashboardPage;
