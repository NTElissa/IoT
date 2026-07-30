import React, { useEffect, useMemo, useState } from 'react';
import { Plus, UserCog, KeyRound, Trash2 } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import Modal from '../components/common/Modal.jsx';
import PasswordInput from '../components/common/PasswordInput.jsx';
import SearchInput from '../components/common/SearchInput.jsx';
import { Card, EmptyState, ErrorState, Spinner } from '../components/common/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as userService from '../services/userService.js';
import { roleLabel } from '../utils/helpers.js';
import { HOSPITAL_ROLES } from '../utils/constants.js';

const emptyForm = { name: '', email: '', password: '', role: 'nurse', phone: '', ward: '' };

const StaffPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState('');
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.ward, roleLabel[u.role]].filter(Boolean).some((f) => f.toLowerCase().includes(q))
    );
  }, [users, search]);

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

  const handleRoleChange = async (u, newRole) => {
    setRoleChangeError('');
    try {
      await userService.changeRole(u._id, newRole);
      load();
    } catch (err) {
      setRoleChangeError(err.message);
    }
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

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await userService.deleteUser(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="Staff">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink/50">Create staff accounts, change roles, and manage access.</p>
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
      {roleChangeError && <div className="mb-4"><ErrorState message={roleChangeError} /></div>}

      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, ward, role…" />
      </div>

      {!loading && !users.length && (
        <EmptyState icon={UserCog} title="No staff accounts yet" description="Create doctor, nurse, and staff accounts here." />
      )}

      {!loading && users.length > 0 && !filteredUsers.length && (
        <EmptyState icon={UserCog} title="No matches" description="Try a different search term." />
      )}

      {!loading && filteredUsers.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/5 text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id} className="border-b border-border/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                  <td className="px-4 py-3">
                    {u._id === currentUser._id ? (
                      <span className="text-ink/60">{roleLabel[u.role]}</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className="rounded-lg border border-border/10 px-2 py-1 text-xs outline-none focus:border-teal-500"
                      >
                        {HOSPITAL_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel[r]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{u.email}</td>
                  <td className="px-4 py-3 text-ink/60">{u.ward || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      title={u.isActive ? 'Click to deactivate' : 'Click to activate'}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.isActive ? 'bg-good/10 text-good' : 'bg-ink/5 text-ink/50'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setResetTarget(u)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline"
                      >
                        <KeyRound size={13} /> Reset password
                      </button>
                      {u._id !== currentUser._id && (
                        <button
                          onClick={() => {
                            setDeleteError('');
                            setDeleteTarget(u);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-crit hover:underline"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
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
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              {HOSPITAL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Ward</label>
            <input
              value={form.ward}
              onChange={(e) => setForm({ ...form, ward: e.target.value })}
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              placeholder="Medical"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              placeholder="+250 7XX XXX XXX"
            />
            <p className="mt-1 text-xs text-ink/40">Used for real-time SMS alerts (bag-change requests, escalations).</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Temporary password</label>
            <PasswordInput
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          <PasswordInput
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
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

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={`Delete ${deleteTarget?.name || ''}?`}>
        <p className="text-sm text-ink/60">
          This permanently deletes the account for <strong>{deleteTarget?.name}</strong>. This cannot be undone.
          If you only want to disable their access, use the Active/Inactive toggle instead and close this dialog.
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
    </AppLayout>
  );
};

export default StaffPage;
