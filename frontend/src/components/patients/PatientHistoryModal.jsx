import React, { useEffect, useState } from 'react';
import { Droplet, ClipboardList, ScrollText, MessageSquarePlus, Pill } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import { Spinner, ErrorState } from '../common/ui.jsx';
import * as patientService from '../../services/patientService.js';
import { formatDateTime } from '../../utils/helpers.js';

const emptyNoteForm = { type: 'comment', text: '', drugName: '', dosage: '', frequency: '', instructions: '' };

const PatientHistoryModal = ({ patient, onClose }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteForm, setNoteForm] = useState(emptyNoteForm);
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  useEffect(() => {
    if (!patient) return;
    setLoading(true);
    setError('');
    patientService
      .getPatientHistory(patient._id)
      .then(setHistory)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [patient?._id]);

  if (!patient) return null;

  const handleAddNote = async (e) => {
    e.preventDefault();
    setSavingNote(true);
    setNoteError('');
    try {
      const note = await patientService.createPatientNote(patient._id, noteForm);
      setHistory((prev) => ({ ...prev, notes: [note, ...(prev.notes || [])] }));
      setNoteForm(emptyNoteForm);
    } catch (err) {
      setNoteError(err.message);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <Modal open={!!patient} onClose={onClose} title={`History · ${patient.name}`} wide>
      {loading && <Spinner />}
      {error && <ErrorState message={error} />}

      {history && (
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <MessageSquarePlus size={15} /> Comments & medications
            </h3>

            <form onSubmit={handleAddNote} className="mb-3 space-y-2 rounded-lg border border-border/10 p-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNoteForm({ ...emptyNoteForm, type: 'comment' })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    noteForm.type === 'comment' ? 'bg-teal-600 text-white' : 'bg-mist text-ink/60'
                  }`}
                >
                  Comment
                </button>
                <button
                  type="button"
                  onClick={() => setNoteForm({ ...emptyNoteForm, type: 'medication' })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    noteForm.type === 'medication' ? 'bg-teal-600 text-white' : 'bg-mist text-ink/60'
                  }`}
                >
                  Medication / drug
                </button>
              </div>

              {noteForm.type === 'comment' ? (
                <textarea
                  required
                  rows={2}
                  value={noteForm.text}
                  onChange={(e) => setNoteForm({ ...noteForm, text: e.target.value })}
                  placeholder="Add a note about this patient…"
                  className="w-full rounded-lg border border-border/10 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    required
                    value={noteForm.drugName}
                    onChange={(e) => setNoteForm({ ...noteForm, drugName: e.target.value })}
                    placeholder="Drug name"
                    className="rounded-lg border border-border/10 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                  <input
                    value={noteForm.dosage}
                    onChange={(e) => setNoteForm({ ...noteForm, dosage: e.target.value })}
                    placeholder="Dosage (e.g. 500mg)"
                    className="rounded-lg border border-border/10 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                  <input
                    value={noteForm.frequency}
                    onChange={(e) => setNoteForm({ ...noteForm, frequency: e.target.value })}
                    placeholder="Frequency (e.g. twice daily)"
                    className="rounded-lg border border-border/10 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                  <input
                    value={noteForm.instructions}
                    onChange={(e) => setNoteForm({ ...noteForm, instructions: e.target.value })}
                    placeholder="Instructions (optional)"
                    className="rounded-lg border border-border/10 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              )}

              {noteError && <p className="rounded-lg bg-crit/5 px-2 py-1.5 text-xs text-crit">{noteError}</p>}

              <button
                type="submit"
                disabled={savingNote}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {savingNote ? 'Saving…' : 'Add'}
              </button>
            </form>

            {!history.notes?.length && <p className="text-sm text-ink/40">No comments or medications recorded yet.</p>}
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {history.notes?.map((n) => (
                <div key={n._id} className="rounded-lg bg-mist px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-ink">
                      {n.type === 'medication' ? <Pill size={13} /> : <MessageSquarePlus size={13} />}
                      {n.type === 'medication' ? n.drugName : 'Comment'}
                    </span>
                    <span className="text-xs text-ink/40">{formatDateTime(n.createdAt)}</span>
                  </div>
                  {n.type === 'medication' ? (
                    <p className="mt-0.5 text-xs text-ink/50">
                      {[n.dosage, n.frequency, n.instructions].filter(Boolean).join(' · ') || 'No further details'}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-ink/60">{n.text}</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink/40">by {n.author?.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Droplet size={15} /> IV fluid history
            </h3>
            {!history.ivFluids.length && <p className="text-sm text-ink/40">No IV fluids recorded.</p>}
            <div className="space-y-2">
              {history.ivFluids.map((bag) => (
                <div key={bag._id} className="rounded-lg bg-mist px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">
                      {bag.fluidType} · {bag.bagSize}ml
                    </span>
                    <span className="text-xs text-ink/50">{bag.status.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink/50">
                    Room {bag.room?.roomNumber || '—'} · started {formatDateTime(bag.startTime)}
                    {bag.endTime && ` · ended ${formatDateTime(bag.endTime)}`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <ClipboardList size={15} /> Task history
            </h3>
            {!history.tasks.length && <p className="text-sm text-ink/40">No tasks recorded.</p>}
            <div className="space-y-2">
              {history.tasks.map((t) => (
                <div key={t._id} className="rounded-lg bg-mist px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{t.taskType.replace('_', ' ')}</span>
                    <span className="text-xs text-ink/50">{t.status.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink/50">
                    {t.assignedBy?.name} → {t.assignedTo?.name} · {formatDateTime(t.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <ScrollText size={15} /> Event log
            </h3>
            {!history.events.length && <p className="text-sm text-ink/40">No events recorded.</p>}
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {history.events.map((e) => (
                <div key={e._id} className="flex items-center justify-between text-xs">
                  <span className="text-ink/70">
                    {e.eventType.replace(/_/g, ' ')} {e.performedBy ? `· ${e.performedBy.name}` : ''}
                  </span>
                  <span className="text-ink/40">{formatDateTime(e.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PatientHistoryModal;
