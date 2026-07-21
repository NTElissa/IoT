import React, { useEffect, useState } from 'react';
import { Plus, BedDouble, Settings2 } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import Modal from '../components/common/Modal.jsx';
import { Card, EmptyState, ErrorState, Spinner } from '../components/common/ui.jsx';
import * as roomService from '../services/roomService.js';
import * as userService from '../services/userService.js';

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ roomNumber: '', ward: '', bedCount: 2 });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [assignRoom, setAssignRoom] = useState(null);
  const [assignForm, setAssignForm] = useState({ doctorIds: [], nurseIds: [] });

  const load = () => {
    setLoading(true);
    roomService
      .getRooms()
      .then(setRooms)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    userService.getUsers({ role: 'doctor' }).then(setDoctors).catch(() => {});
    userService.getUsers({ role: 'nurse' }).then(setNurses).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await roomService.createRoom(createForm);
      setCreateOpen(false);
      setCreateForm({ roomNumber: '', ward: '', bedCount: 2 });
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAssign = (room) => {
    setAssignRoom(room);
    setAssignForm({
      doctorIds: room.assignedDoctors.map((d) => d._id),
      nurseIds: room.assignedNurses.map((n) => n._id),
    });
  };

  const toggleId = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await roomService.assignStaff(assignRoom._id, assignForm);
      setAssignRoom(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Rooms">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink/50">Create rooms and assign the doctors and nurses who can manage them.</p>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          <Plus size={16} /> Add room
        </button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} />}

      {!loading && !rooms.length && (
        <EmptyState icon={BedDouble} title="No rooms yet" description="Add your first room to start assigning patients and staff." />
      )}

      {!loading && rooms.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room._id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-base font-semibold text-ink">{room.roomNumber}</p>
                  <p className="text-xs text-ink/50">{room.ward} · {room.bedCount} beds</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    room.status === 'occupied' ? 'bg-amber-400/10 text-amber-500' : 'bg-good/10 text-good'
                  }`}
                >
                  {room.status}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-ink/60">
                <p>
                  <span className="font-medium text-ink/40">Doctors: </span>
                  {room.assignedDoctors.map((d) => d.name).join(', ') || 'None assigned'}
                </p>
                <p>
                  <span className="font-medium text-ink/40">Nurses: </span>
                  {room.assignedNurses.map((n) => n.name).join(', ') || 'None assigned'}
                </p>
              </div>
              <button
                onClick={() => openAssign(room)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-ink/70 hover:bg-mist"
              >
                <Settings2 size={14} /> Assign staff
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add room">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Room number</label>
            <input
              required
              value={createForm.roomNumber}
              onChange={(e) => setCreateForm({ ...createForm, roomNumber: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              placeholder="R101"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Ward</label>
            <input
              required
              value={createForm.ward}
              onChange={(e) => setCreateForm({ ...createForm, ward: e.target.value })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
              placeholder="Medical"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/70">Bed count</label>
            <input
              type="number"
              min={1}
              value={createForm.bedCount}
              onChange={(e) => setCreateForm({ ...createForm, bedCount: Number(e.target.value) })}
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </div>
          {formError && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Add room'}
          </button>
        </form>
      </Modal>

      <Modal open={!!assignRoom} onClose={() => setAssignRoom(null)} title={`Assign staff · ${assignRoom?.roomNumber || ''}`} wide>
        <form onSubmit={handleAssign} className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-ink/70">Doctors</p>
            <div className="flex flex-wrap gap-2">
              {doctors.map((d) => (
                <label
                  key={d._id}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium ${
                    assignForm.doctorIds.includes(d._id)
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-black/10 text-ink/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={assignForm.doctorIds.includes(d._id)}
                    onChange={() =>
                      setAssignForm({ ...assignForm, doctorIds: toggleId(assignForm.doctorIds, d._id) })
                    }
                  />
                  {d.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ink/70">Nurses</p>
            <div className="flex flex-wrap gap-2">
              {nurses.map((n) => (
                <label
                  key={n._id}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium ${
                    assignForm.nurseIds.includes(n._id)
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-black/10 text-ink/60'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={assignForm.nurseIds.includes(n._id)}
                    onChange={() => setAssignForm({ ...assignForm, nurseIds: toggleId(assignForm.nurseIds, n._id) })}
                  />
                  {n.name}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save assignment'}
          </button>
        </form>
      </Modal>
    </AppLayout>
  );
};

export default RoomsPage;
