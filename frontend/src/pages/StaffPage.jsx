import React, { useEffect, useState } from 'react';
import { Plus, UserCog, KeyRound } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import Modal from '../components/common/Modal.jsx';
import { Card, EmptyState, ErrorState, Spinner } from '../components/common/ui.jsx';
import * as userService from '../services/userService.js';
import { roleLabel } from '../utils/helpers.js';

const emptyForm = { name: '', email: '', password: '', role: 'nurse', phone: '', ward: '' };

const StaffPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const load = () => {
    setLoading(true);
    userService
      .getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await userService.createUser(form);
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    await userService.updateUser(u._id, { isActive: !u.isActive });
    load();
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.resetPassword(resetTarget._id, newPassword);
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Staff">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink/50">Create and manage doctor, nurse, support staff, and admin accounts.</p>
        <button
          onClick={() => {
            setForm(emptyForm);
            setFormError('');
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          <Plus size={16} /> New account
        </button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} />}

      {!loading && !users.length && (
        <EmptyState icon={UserCog} title="No staff accounts yet" description="Create doctor, nurse, and support staff accounts here." />
      )}

      {!loading && users.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3 text-ink/60">{roleLabel[u.role]}</td>
                  <td className="px-4 py-3 text-ink/60">{u.email}</td>
                  <td className="px-4 py-3 text-ink/60">{u.ward || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.isActive ? 'bg-good/10 text-good' : 'bg-ink/5 text-ink/50'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setResetTarget(u)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline"
                    >
                      <KeyRound size={13} /> Reset password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create staff account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="support_staff">Support Staff</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Ward</label>
            <input
              value={form.ward}
              onChange={(e) => setForm({ ...form, ward: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              placeholder="Medical"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Temporary password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>

          {formError && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{formError}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset password · ${resetTarget?.name || ''}`}>
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Reset password'}
          </button>
        </form>
      </Modal>
    </AppLayout>
  );
};

export default StaffPage;
