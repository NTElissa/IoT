import React, { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import Modal from '../components/common/Modal.jsx';
import { Card, EmptyState, ErrorState, Spinner } from '../components/common/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as patientService from '../services/patientService.js';
import * as roomService from '../services/roomService.js';
import * as userService from '../services/userService.js';
import { formatDateTime } from '../utils/helpers.js';

const emptyForm = {
  name: '',
  dateOfBirth: '',
  gender: 'F',
  contact: '',
  medicalHistory: '',
  room: '',
  bed: '',
  assignedDoctor: '',
  assignedNurse: '',
};

const PatientsPage = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const isAdmin = user.role === 'admin';

  const load = () => {
    setLoading(true);
    patientService
      .getPatients()
      .then(setPatients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      roomService.getRooms().then(setRooms).catch(() => {});
      userService.getUsers({ role: 'doctor' }).then(setDoctors).catch(() => {});
      userService.getUsers({ role: 'nurse' }).then(setNurses).catch(() => {});
    }
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (patient) => {
    setForm({
      name: patient.name,
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '',
      gender: patient.gender,
      contact: patient.contact || '',
      medicalHistory: patient.medicalHistory || '',
      room: patient.room?._id || '',
      bed: patient.bed || '',
      assignedDoctor: patient.assignedDoctor?._id || '',
      assignedNurse: patient.assignedNurse?._id || '',
    });
    setEditingId(patient._id);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        await patientService.updatePatient(editingId, form);
      } else {
        await patientService.createPatient(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title={isAdmin ? 'Patients' : 'My Patients'}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink/50">
          {isAdmin ? 'Register patients and assign their room and care team.' : 'Patients currently in your care.'}
        </p>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus size={16} /> Register patient
          </button>
        )}
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} />}

      {!loading && !patients.length && (
        <EmptyState icon={Users} title="No patients yet" description="Registered patients will appear here." />
      )}

      {!loading && patients.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink/40">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Room / Bed</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Nurse</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Admitted</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-ink/60">{p.gender}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {p.room?.roomNumber || '—'} {p.bed && `/ ${p.bed}`}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{p.assignedDoctor?.name || '—'}</td>
                  <td className="px-4 py-3 text-ink/60">{p.assignedNurse?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === 'admitted' ? 'bg-good/10 text-good' : 'bg-ink/5 text-ink/50'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/50">{formatDateTime(p.admittedAt)}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(p)} className="text-xs font-medium text-teal-600 hover:underline">
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit patient' : 'Register patient'} wide>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Date of birth</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Contact</label>
            <input
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Medical history</label>
            <textarea
              rows={2}
              value={form.medicalHistory}
              onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Room</label>
            <select
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              <option value="">Not assigned</option>
              {rooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.roomNumber} · {r.ward}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Bed</label>
            <input
              value={form.bed}
              onChange={(e) => setForm({ ...form, bed: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              placeholder="A"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Assigned doctor</label>
            <select
              value={form.assignedDoctor}
              onChange={(e) => setForm({ ...form, assignedDoctor: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              <option value="">Not assigned</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Assigned nurse</label>
            <select
              value={form.assignedNurse}
              onChange={(e) => setForm({ ...form, assignedNurse: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              <option value="">Not assigned</option>
              {nurses.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          {formError && <p className="sm:col-span-2 rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{formError}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Register patient'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
};

export default PatientsPage;
