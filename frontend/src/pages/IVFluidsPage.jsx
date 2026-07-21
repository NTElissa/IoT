import React, { useEffect, useState } from 'react';
import { Plus, Droplet, RefreshCw, XCircle, FileWarning } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import Modal from '../components/common/Modal.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { Card, EmptyState, ErrorState, Spinner } from '../components/common/ui.jsx';
import useLiveIVFluids from '../hooks/useLiveIVFluids.js';
import { useAuth } from '../context/AuthContext.jsx';
import * as ivFluidService from '../services/ivFluidService.js';
import * as roomService from '../services/roomService.js';
import * as patientService from '../services/patientService.js';
import { FLUID_TYPES, BAG_SIZES } from '../utils/constants.js';
import { levelBand, timeUntil } from '../utils/helpers.js';

const emptyForm = { fluidType: 'Normal Saline', bagSize: 500, flowRate: 150, room: '', patient: '' };

const IVFluidsPage = () => {
  const { user } = useAuth();
  const { bags, loading, error, refresh } = useLiveIVFluids();
  const [rooms, setRooms] = useState([]);
  const [patients, setPatients] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [complicationTarget, setComplicationTarget] = useState(null);
  const [complicationText, setComplicationText] = useState('');

  const canManage = ['admin', 'doctor', 'nurse'].includes(user.role);

  useEffect(() => {
    if (!canManage) return;
    roomService.getRooms().then(setRooms).catch(() => {});
    patientService.getPatients().then(setPatients).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await ivFluidService.createIVFluid(form);
      setModalOpen(false);
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangeBag = async (bag) => {
    await ivFluidService.changeBag(bag._id);
    refresh();
  };

  const handleRemove = async (bag) => {
    await ivFluidService.removeIVFluid(bag._id);
    refresh();
  };

  const handleComplication = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ivFluidService.recordComplication(complicationTarget._id, complicationText);
      setComplicationTarget(null);
      setComplicationText('');
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = form.room ? patients.filter((p) => p.room?._id === form.room) : patients;

  return (
    <AppLayout title="IV Fluids">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink/50">Start and manage IV fluids for the rooms you're assigned to.</p>
        {canManage && (
          <button
            onClick={() => {
              setForm(emptyForm);
              setFormError('');
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus size={16} /> Start IV fluid
          </button>
        )}
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} />}

      {!loading && !bags.length && (
        <EmptyState icon={Droplet} title="No IV fluids yet" description="Bags you start will appear here with live fluid levels." />
      )}

      {!loading && bags.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Fluid</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Empty in</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {bags.map((bag) => (
                <tr key={bag._id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{bag.patient?.name}</td>
                  <td className="px-4 py-3 text-ink/60">{bag.room?.roomNumber}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {bag.fluidType} · {bag.bagSize}ml
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge band={levelBand(bag.fluidLevel)} level={Math.round(bag.fluidLevel)} />
                  </td>
                  <td className="px-4 py-3 text-ink/50">
                    {bag.status === 'completed' || bag.status === 'removed' ? '—' : timeUntil(bag.estimatedEmptyTime)}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{bag.status.replace('_', ' ')}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        {bag.status !== 'removed' && bag.status !== 'completed' && (
                          <button
                            onClick={() => handleChangeBag(bag)}
                            title="Change bag"
                            className="text-ink/40 hover:text-teal-600"
                          >
                            <RefreshCw size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => setComplicationTarget(bag)}
                          title="Record complication"
                          className="text-ink/40 hover:text-amber-500"
                        >
                          <FileWarning size={15} />
                        </button>
                        {bag.status !== 'removed' && (
                          <button onClick={() => handleRemove(bag)} title="Remove bag" className="text-ink/40 hover:text-crit">
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Start IV fluid">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Room</label>
            <select
              required
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value, patient: '' })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              <option value="">Select room…</option>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.roomNumber} · {r.ward}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Patient</label>
            <select
              required
              value={form.patient}
              onChange={(e) => setForm({ ...form, patient: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              <option value="">Select patient…</option>
              {filteredPatients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Fluid type</label>
            <select
              value={form.fluidType}
              onChange={(e) => setForm({ ...form, fluidType: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              {FLUID_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/70">Bag size (ml)</label>
              <select
                value={form.bagSize}
                onChange={(e) => setForm({ ...form, bagSize: Number(e.target.value) })}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              >
                {BAG_SIZES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/70">Flow rate (ml/hr)</label>
              <input
                type="number"
                min={1}
                value={form.flowRate}
                onChange={(e) => setForm({ ...form, flowRate: Number(e.target.value) })}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {formError && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{formError}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Starting…' : 'Start IV fluid'}
          </button>
        </form>
      </Modal>

      <Modal open={!!complicationTarget} onClose={() => setComplicationTarget(null)} title="Record complication">
        <form onSubmit={handleComplication} className="space-y-4">
          <textarea
            required
            rows={3}
            value={complicationText}
            onChange={(e) => setComplicationText(e.target.value)}
            placeholder="Describe the complication…"
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save record'}
          </button>
        </form>
      </Modal>
    </AppLayout>
  );
};

export default IVFluidsPage;
