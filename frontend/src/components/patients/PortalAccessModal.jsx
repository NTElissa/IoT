import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import PasswordInput from '../common/PasswordInput.jsx';
import * as patientService from '../../services/patientService.js';

const PortalAccessModal = ({ patient, onClose, onChanged }) => {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!patient) return null;

  const handleEnable = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await patientService.enablePortalAccess(patient._id, password);
      setPassword('');
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    setSaving(true);
    setError('');
    try {
      await patientService.disablePortalAccess(patient._id);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(patient.patientCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal open={!!patient} onClose={onClose} title={`Portal access · ${patient.name}`}>
      <div className="mb-4 flex items-center justify-between rounded-lg bg-mist px-3 py-2.5">
        <div>
          <p className="text-xs text-ink/40">Patient ID</p>
          <p className="font-mono-data text-sm font-semibold text-ink">{patient.patientCode}</p>
        </div>
        <button onClick={copyCode} className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:underline">
          <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {patient.portalEnabled ? (
        <div className="space-y-4">
          <p className="text-sm text-ink/60">
            Portal access is currently <span className="font-medium text-good">enabled</span>. Set a new password
            below, or disable access entirely.
          </p>
          <form onSubmit={handleEnable} className="space-y-3">
            <PasswordInput
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
            />
            {error && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Update password'}
            </button>
          </form>
          <button
            onClick={handleDisable}
            disabled={saving}
            className="w-full rounded-lg border border-crit/20 px-4 py-2.5 text-sm font-medium text-crit hover:bg-crit/5"
          >
            Disable portal access
          </button>
        </div>
      ) : (
        <form onSubmit={handleEnable} className="space-y-4">
          <p className="text-sm text-ink/60">
            Give this patient sign-in access using their Patient ID above and a password you set now. Share both
            with them directly.
          </p>
          <PasswordInput
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set a password"
          />
          {error && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? 'Enabling…' : 'Enable portal access'}
          </button>
        </form>
      )}
    </Modal>
  );
};

export default PortalAccessModal;
