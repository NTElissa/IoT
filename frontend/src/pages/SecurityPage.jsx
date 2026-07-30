import React, { useEffect, useState } from 'react';
import { Fingerprint, ShieldCheck, Trash2, Plus, KeyRound, History } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import Modal from '../components/common/Modal.jsx';
import PasswordInput from '../components/common/PasswordInput.jsx';
import { Card, EmptyState, ErrorState, Spinner } from '../components/common/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as webauthnService from '../services/webauthnService.js';
import * as twoFactorService from '../services/twoFactorService.js';
import * as securityService from '../services/securityService.js';
import { formatDateTime } from '../utils/helpers.js';

const SecurityPage = () => {
  const { user, refreshUser } = useAuth();
  const canViewLoginLog = user.role === 'admin' || user.role === 'super_admin';

  // Passkeys
  const [passkeys, setPasskeys] = useState([]);
  const [passkeysLoading, setPasskeysLoading] = useState(true);
  const [addPasskeyOpen, setAddPasskeyOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [passkeyError, setPasskeyError] = useState('');
  const [savingPasskey, setSavingPasskey] = useState(false);

  // 2FA
  const [twoFactorSetup, setTwoFactorSetup] = useState(null); // { qrDataUrl, manualEntryKey }
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableOpen, setDisableOpen] = useState(false);

  // Login activity
  const [loginEvents, setLoginEvents] = useState([]);
  const [loginEventsLoading, setLoginEventsLoading] = useState(canViewLoginLog);
  const [loginEventsError, setLoginEventsError] = useState('');

  const loadPasskeys = () => {
    setPasskeysLoading(true);
    webauthnService
      .listPasskeys()
      .then(setPasskeys)
      .catch(() => {})
      .finally(() => setPasskeysLoading(false));
  };

  useEffect(() => {
    loadPasskeys();
    if (canViewLoginLog) {
      securityService
        .getLoginEvents()
        .then(setLoginEvents)
        .catch((err) => setLoginEventsError(err.message))
        .finally(() => setLoginEventsLoading(false));
    }
  }, []);

  const handleAddPasskey = async (e) => {
    e.preventDefault();
    setSavingPasskey(true);
    setPasskeyError('');
    try {
      await webauthnService.registerPasskey(deviceName || 'Passkey');
      setAddPasskeyOpen(false);
      setDeviceName('');
      loadPasskeys();
    } catch (err) {
      setPasskeyError(err.message || 'Could not register this passkey.');
    } finally {
      setSavingPasskey(false);
    }
  };

  const handleRemovePasskey = async (id) => {
    await webauthnService.removePasskey(id);
    loadPasskeys();
  };

  const handleStartTwoFactor = async () => {
    setTwoFactorError('');
    try {
      const data = await twoFactorService.setupTwoFactor();
      setTwoFactorSetup(data);
    } catch (err) {
      setTwoFactorError(err.message);
    }
  };

  const handleConfirmTwoFactor = async (e) => {
    e.preventDefault();
    setTwoFactorBusy(true);
    setTwoFactorError('');
    try {
      await twoFactorService.confirmTwoFactor(twoFactorCode);
      setTwoFactorSetup(null);
      setTwoFactorCode('');
      await refreshUser();
    } catch (err) {
      setTwoFactorError(err.message);
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleDisableTwoFactor = async (e) => {
    e.preventDefault();
    setTwoFactorBusy(true);
    setTwoFactorError('');
    try {
      await twoFactorService.disableTwoFactor(disablePassword);
      setDisableOpen(false);
      setDisablePassword('');
      await refreshUser();
    } catch (err) {
      setTwoFactorError(err.message);
    } finally {
      setTwoFactorBusy(false);
    }
  };

  return (
    <AppLayout title="Security">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <Fingerprint size={18} className="text-teal-600" /> Passkeys & fingerprint sign-in
          </h2>
          <p className="mb-4 text-sm text-ink/50">
            Register this device's fingerprint, face unlock, or security key to sign in without typing a password.
          </p>

          {passkeysLoading && <Spinner />}
          {!passkeysLoading && !passkeys.length && (
            <EmptyState icon={Fingerprint} title="No passkeys yet" description="Add one to enable fingerprint sign-in." />
          )}
          {!passkeysLoading && passkeys.length > 0 && (
            <div className="space-y-2">
              {passkeys.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded-lg bg-mist px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-ink">{p.deviceName}</p>
                    <p className="text-xs text-ink/40">Added {formatDateTime(p.createdAt)}</p>
                  </div>
                  <button onClick={() => handleRemovePasskey(p._id)} className="text-ink/40 hover:text-crit">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setPasskeyError('');
              setAddPasskeyOpen(true);
            }}
            className="mt-4 flex items-center gap-1.5 rounded-lg border border-border/10 px-3 py-2 text-sm font-medium text-ink/70 hover:bg-mist"
          >
            <Plus size={15} /> Add a passkey on this device
          </button>
        </Card>

        <Card>
          <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <ShieldCheck size={18} className="text-teal-600" /> Two-factor authentication
          </h2>
          <p className="mb-4 text-sm text-ink/50">
            Require a 6-digit code from an authenticator app (e.g. Google Authenticator) every time you sign in
            with a password.
          </p>

          {twoFactorError && <div className="mb-3"><ErrorState message={twoFactorError} /></div>}

          {user.twoFactorEnabled ? (
            <div className="flex items-center justify-between rounded-lg bg-good/10 px-3 py-2.5 text-sm text-good">
              <span className="flex items-center gap-1.5"><ShieldCheck size={15} /> Enabled</span>
              <button onClick={() => setDisableOpen(true)} className="text-xs font-medium underline">
                Disable
              </button>
            </div>
          ) : twoFactorSetup ? (
            <form onSubmit={handleConfirmTwoFactor} className="space-y-3">
              <div className="flex justify-center">
                <img src={twoFactorSetup.qrDataUrl} alt="Two-factor setup QR code" className="h-40 w-40 rounded-lg border border-border/10" />
              </div>
              <p className="text-center text-xs text-ink/40">
                Or enter this key manually: <span className="font-mono-data">{twoFactorSetup.manualEntryKey}</span>
              </p>
              <input
                required
                inputMode="numeric"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter the 6-digit code"
                className="w-full rounded-lg border border-border/10 bg-surface px-3 py-2.5 text-center text-sm tracking-widest text-ink outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={twoFactorBusy}
                className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {twoFactorBusy ? 'Confirming…' : 'Confirm and enable'}
              </button>
            </form>
          ) : (
            <button
              onClick={handleStartTwoFactor}
              className="flex items-center gap-1.5 rounded-lg border border-border/10 px-3 py-2 text-sm font-medium text-ink/70 hover:bg-mist"
            >
              <KeyRound size={15} /> Set up two-factor authentication
            </button>
          )}
        </Card>

        {canViewLoginLog && (
          <Card className="lg:col-span-2">
            <h2 className="mb-1 flex items-center gap-2 font-display text-base font-semibold text-ink">
              <History size={18} className="text-teal-600" /> Login activity
            </h2>
            <p className="mb-4 text-sm text-ink/50">
              {user.role === 'super_admin'
                ? 'Every sign-in attempt across the platform.'
                : "Every sign-in attempt for this hospital's accounts."}
            </p>
            {loginEventsLoading && <Spinner />}
            {loginEventsError && <ErrorState message={loginEventsError} />}
            {!loginEventsLoading && !loginEvents.length && (
              <p className="text-sm text-ink/40">No login activity recorded yet.</p>
            )}
            {!loginEventsLoading && loginEvents.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/5 text-left text-xs uppercase tracking-wide text-ink/40">
                      <th className="py-2 pr-3">User</th>
                      <th className="py-2 pr-3">Method</th>
                      <th className="py-2 pr-3">Result</th>
                      <th className="py-2 pr-3">IP</th>
                      <th className="py-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginEvents.map((ev) => (
                      <tr key={ev._id} className="border-b border-border/5 last:border-0">
                        <td className="py-2 pr-3 text-ink/70">{ev.user?.name || ev.email}</td>
                        <td className="py-2 pr-3 text-ink/50">{ev.method}</td>
                        <td className="py-2 pr-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              ev.success ? 'bg-good/10 text-good' : 'bg-crit/10 text-crit'
                            }`}
                          >
                            {ev.success ? 'Success' : ev.reason?.replace(/_/g, ' ') || 'Failed'}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-ink/40">{ev.ip || '—'}</td>
                        <td className="py-2 text-ink/40">{formatDateTime(ev.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      <Modal open={addPasskeyOpen} onClose={() => setAddPasskeyOpen(false)} title="Add a passkey">
        <form onSubmit={handleAddPasskey} className="space-y-4">
          <p className="text-sm text-ink/60">
            Your browser will prompt you to use this device's fingerprint, face unlock, PIN, or a security key.
          </p>
          <input
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="Name this device (e.g. Work laptop)"
            className="w-full rounded-lg border border-border/10 bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-teal-500"
          />
          {passkeyError && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{passkeyError}</p>}
          <button
            type="submit"
            disabled={savingPasskey}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {savingPasskey ? 'Waiting for your device…' : 'Continue'}
          </button>
        </form>
      </Modal>

      <Modal open={disableOpen} onClose={() => setDisableOpen(false)} title="Disable two-factor authentication">
        <form onSubmit={handleDisableTwoFactor} className="space-y-4">
          <p className="text-sm text-ink/60">Confirm your password to disable two-factor authentication.</p>
          <PasswordInput required value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
          {twoFactorError && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{twoFactorError}</p>}
          <button
            type="submit"
            disabled={twoFactorBusy}
            className="w-full rounded-lg bg-crit px-4 py-2.5 text-sm font-medium text-white hover:bg-crit/90 disabled:opacity-60"
          >
            {twoFactorBusy ? 'Disabling…' : 'Disable two-factor authentication'}
          </button>
        </form>
      </Modal>
    </AppLayout>
  );
};

export default SecurityPage;
