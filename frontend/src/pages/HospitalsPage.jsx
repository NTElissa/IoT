import React, { useEffect, useState } from 'react';
import { Plus, Building2, Trash2 } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import Modal from '../components/common/Modal.jsx';
import PasswordInput from '../components/common/PasswordInput.jsx';
import { Card, EmptyState, ErrorState, Spinner } from '../components/common/ui.jsx';
import * as hospitalService from '../services/hospitalService.js';

const emptyForm = { name: '', address: '', phone: '', adminName: '', adminEmail: '', adminPassword: '', adminPhone: '' };

const HospitalsPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    hospitalService
      .getHospitals()
      .then(setHospitals)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await hospitalService.createHospital(form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSuspended = async (h) => {
    await hospitalService.updateHospital(h._id, { isActive: !h.isActive });
    load();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await hospitalService.deleteHospital(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="Hospitals">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink/50">Register a new hospital and its first administrator account.</p>
        <button
          onClick={() => {
            setForm(emptyForm);
            setFormError('');
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          <Plus size={16} /> Register hospital
        </button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} />}

      {!loading && !hospitals.length && (
        <EmptyState icon={Building2} title="No hospitals yet" description="Register the first hospital to get started." />
      )}

      {!loading && hospitals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((h) => (
            <Card key={h._id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-base font-semibold text-ink">{h.name}</p>
                  <p className="text-xs text-ink/50">{h.address || 'No address on file'}</p>
                </div>
                <button
                  onClick={() => toggleSuspended(h)}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    h.isActive ? 'bg-good/10 text-good' : 'bg-ink/5 text-ink/50'
                  }`}
                >
                  {h.isActive ? 'Active' : 'Suspended'}
                </button>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-ink/50">
                <span>{h.adminCount} admin{h.adminCount === 1 ? '' : 's'}</span>
                <span>{h.staffCount} staff total</span>
              </div>
              <button
                onClick={() => setDeleteTarget(h)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-crit/20 px-3 py-2 text-xs font-medium text-crit hover:bg-crit/5"
              >
                <Trash2 size={13} /> Delete hospital
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register hospital" wide>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Hospital name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Hospital phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div className="sm:col-span-2 mt-2 border-t border-border/5 pt-4">
            <p className="mb-3 text-sm font-semibold text-ink">First administrator account</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Admin name</label>
            <input
              required
              value={form.adminName}
              onChange={(e) => setForm({ ...form, adminName: e.target.value })}
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Admin email</label>
            <input
              type="email"
              required
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Admin phone</label>
            <input
              value={form.adminPhone}
              onChange={(e) => setForm({ ...form, adminPhone: e.target.value })}
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Admin password</label>
            <PasswordInput
              required
              minLength={6}
              value={form.adminPassword}
              onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
            />
          </div>

          {formError && <p className="sm:col-span-2 rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{formError}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Register hospital'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={`Delete ${deleteTarget?.name || ''}?`}>
        <p className="text-sm text-ink/60">
          This permanently deletes <strong>{deleteTarget?.name}</strong> and every account, room, patient, and
          IV fluid record that belongs to it. This cannot be undone.
        </p>
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
    </AppLayout>
  );
};

export default HospitalsPage;
