import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal.jsx';
import * as userService from '../../services/userService.js';
import * as taskService from '../../services/taskService.js';

const DelegateTaskModal = ({ bag, onClose, onDelegated }) => {
  const [staff, setStaff] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [taskType, setTaskType] = useState('bag_change');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bag) return;
    userService.getUsers({ role: 'support_staff' }).then(setStaff).catch(() => {});
    setDescription(
      `Change IV bag for ${bag.patient?.name || 'patient'} in room ${bag.room?.roomNumber || ''}`
    );
  }, [bag]);

  if (!bag) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assignedTo) {
      setError('Choose a support staff member');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const task = await taskService.createTask({
        assignedTo,
        taskType,
        description,
        ivFluid: bag._id,
        room: bag.room?._id,
        patient: bag.patient?._id,
      });
      onDelegated?.(task);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={!!bag} onClose={onClose} title="Delegate task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-mist px-3 py-2 text-sm text-ink/60">
          {bag.patient?.name} · Room {bag.room?.roomNumber} · {bag.fluidType}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">Task type</label>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
          >
            <option value="bag_change">Bag change</option>
            <option value="bag_removal">Bag removal</option>
            <option value="check_flow">Check flow</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">Assign to</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
          >
            <option value="">Select support staff…</option>
            {staff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s.ward ? `· ${s.ward}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">Notes</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
          />
        </div>

        {error && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? 'Delegating…' : 'Delegate task'}
        </button>
      </form>
    </Modal>
  );
};

export default DelegateTaskModal;
