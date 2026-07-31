import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Droplets, ArrowRight, Fingerprint, ShieldCheck, User, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/common/PasswordInput.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const LoginPage = () => {
  const { login, patientLogin, loginWithGoogle, loginWithPasskey, completeTwoFactor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('staff'); // 'staff' | 'patient'
  const [form, setForm] = useState({ email: '', password: '' });
  const [patientForm, setPatientForm] = useState({ patientCode: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [twoFactorState, setTwoFactorState] = useState(null); // { tempToken }
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const googleButtonRef = useRef(null);

  const goToDefault = (loggedInUser) => {
    const fallback =
      loggedInUser.role === 'super_admin'
        ? '/hospitals'
        : loggedInUser.role === 'patient'
        ? '/portal'
        : '/dashboard';
    const redirectTo = location.state?.from?.pathname || fallback;
    navigate(redirectTo, { replace: true });
  };

  const handleAuthResult = (result) => {
    if (result?.requiresTwoFactor) {
      setTwoFactorState({ tempToken: result.tempToken });
      return;
    }
    goToDefault(result);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      handleAuthResult(await login(form.email, form.password));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      handleAuthResult(await patientLogin(patientForm.patientCode.toUpperCase().trim(), patientForm.password));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasskey = async () => {
    if (!form.email) {
      setError('Enter your email above first, then use the passkey button.');
      return;
    }
    setError('');
    setPasskeyLoading(true);
    try {
      handleAuthResult(await loginWithPasskey(form.email));
    } catch (err) {
      setError(err.message);
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await completeTwoFactor(twoFactorState.tempToken, twoFactorCode);
      goToDefault(loggedInUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Renders Google's own Sign-In button once its script has loaded, and
  // wires its callback to our backend verification.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || twoFactorState || mode !== 'staff') return;

    const renderButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setError('');
          try {
            handleAuthResult(await loginWithGoogle(response.credential));
          } catch (err) {
            setError(err.message);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'signin_with',
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderButton();
        }
      }, 300);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twoFactorState, mode]);

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-teal-600 p-1.5 text-white">
              <Droplets size={20} />
            </div>
            <span className="font-display text-lg font-semibold text-ink">DripWatch</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="rounded-2xl border border-border/5 bg-surface p-7 shadow-card">
          {!twoFactorState ? (
            <>
              <div className="mb-5 flex rounded-lg bg-mist p-1 text-sm font-medium">
                <button
                  onClick={() => switchMode('staff')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${
                    mode === 'staff' ? 'bg-surface text-ink shadow-card' : 'text-ink/50'
                  }`}
                >
                  <User size={14} /> Staff sign-in
                </button>
                <button
                  onClick={() => switchMode('patient')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${
                    mode === 'patient' ? 'bg-surface text-ink shadow-card' : 'text-ink/50'
                  }`}
                >
                  <HeartPulse size={14} /> Patient sign-in
                </button>
              </div>

              {mode === 'staff' ? (
                <>
                  <h1 className="font-display text-xl font-semibold text-ink">Welcome back</h1>
                  <p className="mt-1 text-sm text-ink/50">Sign in with your hospital account.</p>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink/70">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full rounded-lg border border-border/10 bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-teal-500"
                        placeholder="you@remerarukoma.rw"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink/70">Password</label>
                      <PasswordInput
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>

                    {error && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
                    >
                      {loading ? 'Signing in…' : 'Sign in'}
                      {!loading && <ArrowRight size={16} />}
                    </button>
                  </form>

                  <button
                    onClick={handlePasskey}
                    disabled={passkeyLoading}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border/10 px-4 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:bg-mist disabled:opacity-60"
                  >
                    <Fingerprint size={16} />
                    {passkeyLoading ? 'Waiting for fingerprint / passkey…' : 'Sign in with fingerprint or passkey'}
                  </button>

                  {GOOGLE_CLIENT_ID && (
                    <>
                      <div className="my-4 flex items-center gap-3 text-xs text-ink/30">
                        <div className="h-px flex-1 bg-border/10" />
                        or
                        <div className="h-px flex-1 bg-border/10" />
                      </div>
                      <div ref={googleButtonRef} className="flex justify-center" />
                    </>
                  )}
                </>
              ) : (
                <>
                  <h1 className="font-display text-xl font-semibold text-ink">Patient sign-in</h1>
                  <p className="mt-1 text-sm text-ink/50">
                    Use the Patient ID your care team gave you, along with your password.
                  </p>

                  <form onSubmit={handlePatientSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink/70">Patient ID</label>
                      <input
                        required
                        value={patientForm.patientCode}
                        onChange={(e) => setPatientForm({ ...patientForm, patientCode: e.target.value })}
                        className="w-full rounded-lg border border-border/10 bg-surface px-3 py-2.5 text-sm uppercase tracking-wide text-ink outline-none focus:border-teal-500"
                        placeholder="P-XXXXXX"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink/70">Password</label>
                      <PasswordInput
                        required
                        value={patientForm.password}
                        onChange={(e) => setPatientForm({ ...patientForm, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>

                    {error && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
                    >
                      {loading ? 'Signing in…' : 'Sign in'}
                      {!loading && <ArrowRight size={16} />}
                    </button>
                  </form>
                  <p className="mt-4 text-center text-xs text-ink/40">
                    Don't have a Patient ID yet? Ask your doctor or nurse to enable portal access for you.
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              <h1 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
                <ShieldCheck size={20} className="text-teal-600" /> Two-factor code
              </h1>
              <p className="mt-1 text-sm text-ink/50">
                Enter the 6-digit code from your authenticator app to finish signing in.
              </p>
              <form onSubmit={handleTwoFactorSubmit} className="mt-6 space-y-4">
                <input
                  required
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-lg border border-border/10 bg-surface px-3 py-2.5 text-center text-lg tracking-[0.5em] text-ink outline-none focus:border-teal-500"
                  placeholder="000000"
                />
                {error && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {loading ? 'Verifying…' : 'Verify and sign in'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorState(null);
                    setTwoFactorCode('');
                    setError('');
                  }}
                  className="w-full text-center text-xs text-ink/40 hover:underline"
                >
                  Back to sign in
                </button>
              </form>
            </>
          )}
        </div>

        {!twoFactorState && mode === 'staff' && (
          <p className="mt-6 text-center text-sm text-ink/50">
            First time setting up this hospital?{' '}
            <Link to="/register" className="font-medium text-teal-600 hover:underline">
              Create the Super Admin account
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
