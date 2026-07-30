import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Droplet, RefreshCw, XCircle, FileWarning, Power, PowerOff, Trash2, PlusCircle } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import Modal from '../components/common/Modal.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
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
const ENDED_STATUSES = ['completed', 'removed'];

const IVFluidsPage = () => {
  const { user } = useAuth();
  const { bags, loading, error, refresh } = useLiveIVFluids();
  const [search, setSearch] = useState('');
  const filteredBags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bags;
    return bags.filter((bag) =>
      [bag.patient?.name, bag.room?.roomNumber, bag.fluidType].filter(Boolean).some((f) => f.toLowerCase().includes(q))
    );
  }, [bags, search]);
  const [rooms, setRooms] = useState([]);
  const [patients, setPatients] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [complicationTarget, setComplicationTarget] = useState(null);
  const [complicationText, setComplicationText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [confirmState, setConfirmState] = useState(null); // { message, existingBag }
  const [confirming, setConfirming] = useState(false);

  const canManage = ['admin', 'doctor', 'nurse'].includes(user.role);
  const isAdmin = user.role === 'admin';

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
      if (err.status === 409 && err.data?.requiresConfirmation) {
        setModalOpen(false);
        setConfirmState({ message: err.message, existingBag: err.data.existingBag });
      } else {
        setFormError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // The person has read the warning and wants to proceed anyway - the
  // existing open IV fluid is ended server-side and the new one starts.
  const handleConfirmForce = async () => {
    setConfirming(true);
    try {
      await ivFluidService.createIVFluid({ ...form, force: true });
      setConfirmState(null);
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setConfirmState(null);
      setModalOpen(true);
      setFormError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  // Opens the "start IV fluid" modal pre-filled with the same room/patient -
  // used when a bag has ended and the patient needs a fresh one.
  const openReplacement = (bag) => {
    setForm({
      fluidType: bag.fluidType,
      bagSize: bag.bagSize,
      flowRate: bag.flowRate,
      room: bag.room?._id || '',
      patient: bag.patient?._id || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleChangeBag = async (bag) => {
    await ivFluidService.changeBag(bag._id);
    refresh();
  };

  const handleToggleActive = async (bag) => {
    await ivFluidService.toggleActive(bag._id);
    refresh();
  };

  const handleRemove = async (bag) => {
    await ivFluidService.removeIVFluid(bag._id);
    refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await ivFluidService.deleteIVFluid(deleteTarget._id);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
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

      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by patient, room, fluid type…" />
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} />}

      {!loading && !bags.length && (
        <EmptyState icon={Droplet} title="No IV fluids yet" description="Bags you start will appear here with live fluid levels." />
      )}

      {!loading && bags.length > 0 && !filteredBags.length && (
        <EmptyState icon={Droplet} title="No matches" description="Try a different search term." />
      )}

      {!loading && filteredBags.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/5 text-left text-xs uppercase tracking-wide text-ink/40">
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
              {filteredBags.map((bag) => {
                const ended = ENDED_STATUSES.includes(bag.status);
                const inactive = bag.status === 'inactive';
                return (
                  <tr key={bag._id} className="border-b border-border/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{bag.patient?.name}</td>
                    <td className="px-4 py-3 text-ink/60">{bag.room?.roomNumber}</td>
                    <td className="px-4 py-3 text-ink/60">
                      {bag.fluidType} · {bag.bagSize}ml
                    </td>
                    <td className="px-4 py-3">
                      {inactive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/50">
                          Paused · {Math.round(bag.fluidLevel)}%
                        </span>
                      ) : (
                        <StatusBadge band={levelBand(bag.fluidLevel)} level={Math.round(bag.fluidLevel)} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/50">
                      {ended || inactive ? '—' : timeUntil(bag.estimatedEmptyTime)}
                    </td>
                    <td className="px-4 py-3 text-ink/60">{bag.status.replace('_', ' ')}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3">
                          {ended ? (
                            <button
                              onClick={() => openReplacement(bag)}
                              title="Start a new IV fluid for this patient"
                              className="text-ink/40 hover:text-teal-600"
                            >
                              <PlusCircle size={15} />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleToggleActive(bag)}
                                title={inactive ? 'Resume monitoring' : 'Pause monitoring'}
                                className="text-ink/40 hover:text-teal-600"
                              >
                                {inactive ? <Power size={15} /> : <PowerOff size={15} />}
                              </button>
                              <button
                                onClick={() => handleChangeBag(bag)}
                                title="Change bag"
                                className="text-ink/40 hover:text-teal-600"
                              >
                                <RefreshCw size={15} />
                              </button>
                              <button
                                onClick={() => handleRemove(bag)}
                                title="Remove bag"
                                className="text-ink/40 hover:text-crit"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setComplicationTarget(bag)}
                            title="Record complication"
                            className="text-ink/40 hover:text-amber-500"
                          >
                            <FileWarning size={15} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setDeleteError('');
                                setDeleteTarget(bag);
                              }}
                              title="Delete permanently"
                              className="text-ink/40 hover:text-crit"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
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
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
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
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
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
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
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
                className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
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
                className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
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
            className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
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

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete IV fluid record?">
        <p className="text-sm text-ink/60">
          This permanently deletes this IV fluid record for <strong>{deleteTarget?.patient?.name}</strong>. This
          cannot be undone. If you just want to end monitoring, use the remove (✕) action instead.
        </p>
        {deleteError && <p className="mt-3 rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{deleteError}</p>}
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 rounded-lg border border-border/10 px-4 py-2.5 text-sm font-medium text-ink/70 hover:bg-mist"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 rounded-lg bg-crit px-4 py-2.5 text-sm font-medium text-white hover:bg-crit/90 disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!confirmState}
        onClose={() => {
          setConfirmState(null);
          setModalOpen(true);
        }}
        title="This patient already has an IV fluid running"
      >
        <div className="flex items-start gap-3 rounded-lg bg-amber-400/10 px-3 py-3 text-sm text-amber-700">
          <FileWarning size={18} className="mt-0.5 shrink-0" />
          <p>{confirmState?.message}</p>
        </div>
        <p className="mt-3 text-sm text-ink/60">
          Starting a new IV fluid now will end the current one for this patient. Only proceed once you've
          confirmed the existing line should be replaced.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => {
              setConfirmState(null);
              setModalOpen(true);
            }}
            className="flex-1 rounded-lg border border-border/10 px-4 py-2.5 text-sm font-medium text-ink/70 hover:bg-mist"
          >
            Go back
          </button>
          <button
            onClick={handleConfirmForce}
            disabled={confirming}
            className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {confirming ? 'Starting…' : 'End current bag & start new one'}
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
};

export default IVFluidsPage;
