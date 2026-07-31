import React, { useEffect, useState } from 'react';
import { HeartPulse, AlertTriangle, MessageSquare, Droplet, UserRound } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import ChatPanel from '../components/patients/ChatPanel.jsx';
import { Card, ErrorState, Spinner } from '../components/common/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as patientService from '../services/patientService.js';
import * as vitalsService from '../services/vitalsService.js';
import { levelBand, formatDateTime } from '../utils/helpers.js';
import StatusBadge from '../components/common/StatusBadge.jsx';

const PatientPortalPage = () => {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user.patient) return;
    Promise.all([patientService.getPatient(user.patient), vitalsService.getVitals(user.patient)])
      .then(([p, v]) => {
        setPatient(p);
        setVitals(v);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user.patient]);

  if (loading) {
    return (
      <AppLayout title="My Care">
        <Spinner />
      </AppLayout>
    );
  }

  if (error || !patient) {
    return (
      <AppLayout title="My Care">
        <ErrorState message={error || 'Could not load your record.'} />
      </AppLayout>
    );
  }

  const latestVital = vitals[0];

  return (
    <AppLayout title="My Care">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <UserRound size={18} className="text-teal-600" /> My details
          </h2>
          <div className="space-y-1.5 text-sm text-ink/70">
            <p>
              <span className="text-ink/40">Room: </span>
              {patient.room?.roomNumber || 'Not assigned'} {patient.bed && `· Bed ${patient.bed}`}
            </p>
            <p>
              <span className="text-ink/40">Doctor: </span>
              {patient.assignedDoctor?.name || 'Not assigned'}
            </p>
            <p>
              <span className="text-ink/40">Nurse: </span>
              {patient.assignedNurse?.name || 'Not assigned'}
            </p>
            <p>
              <span className="text-ink/40">Status: </span>
              {patient.status}
            </p>
          </div>

          {patient.allergies?.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-crit/10 px-3 py-2.5 text-sm text-crit">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Known allergies</p>
                <p>{patient.allergies.join(', ')}</p>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <HeartPulse size={18} className="text-teal-600" /> Latest vitals
          </h2>
          {!latestVital ? (
            <p className="text-sm text-ink/40">No vitals recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-mist px-3 py-2">
                <p className="text-xs text-ink/40">Temperature</p>
                <p className="font-medium text-ink">{latestVital.temperatureC ?? '—'}°C</p>
              </div>
              <div className="rounded-lg bg-mist px-3 py-2">
                <p className="text-xs text-ink/40">Heart rate</p>
                <p className="font-medium text-ink">{latestVital.heartRate ?? '—'} bpm</p>
              </div>
              <div className="rounded-lg bg-mist px-3 py-2">
                <p className="text-xs text-ink/40">Blood pressure</p>
                <p className="font-medium text-ink">
                  {latestVital.bloodPressureSystolic ?? '—'}/{latestVital.bloodPressureDiastolic ?? '—'}
                </p>
              </div>
              <div className="rounded-lg bg-mist px-3 py-2">
                <p className="text-xs text-ink/40">O₂ saturation</p>
                <p className="font-medium text-ink">{latestVital.oxygenSaturation ?? '—'}%</p>
              </div>
            </div>
          )}
          {latestVital && (
            <p className="mt-2 text-xs text-ink/40">
              Recorded {formatDateTime(latestVital.createdAt)} by {latestVital.recordedBy?.name}
            </p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <Droplet size={18} className="text-teal-600" /> IV fluid status
          </h2>
          <PatientPortalIVStatus patientId={user.patient} />
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <MessageSquare size={18} className="text-teal-600" /> Message your care team
          </h2>
          <ChatPanel patientId={user.patient} />
        </Card>
      </div>
    </AppLayout>
  );
};

// Small inline component so we can lazily import ivFluidService only here
// without cluttering the main portal file's top-level imports.
const PatientPortalIVStatus = ({ patientId }) => {
  const [bags, setBags] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    import('../services/ivFluidService.js').then((svc) =>
      svc
        .getIVFluids()
        .then(setBags)
        .catch((err) => setError(err.message))
    );
  }, [patientId]);

  if (error) return <ErrorState message={error} />;
  if (bags === null) return <Spinner />;
  if (!bags.length) return <p className="text-sm text-ink/40">No IV fluid currently running.</p>;

  return (
    <div className="space-y-2">
      {bags.map((bag) => (
        <div key={bag._id} className="flex items-center justify-between rounded-lg bg-mist px-3 py-2 text-sm">
          <span className="text-ink/70">
            {bag.fluidType} · {bag.bagSize}ml
          </span>
          <StatusBadge band={levelBand(bag.fluidLevel)} level={Math.round(bag.fluidLevel)} />
        </div>
      ))}
    </div>
  );
};

export default PatientPortalPage;
