import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplets, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/common/PasswordInput.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx';

const RegisterPage = () => {
  const { registerSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerSuperAdmin(form);
      navigate('/hospitals', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4 py-10">
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
          <h1 className="font-display text-xl font-semibold text-ink">Set up the platform</h1>
          <p className="mt-1 text-sm text-ink/50">
            This creates the platform's Super Admin account — a one-time step for a brand-new deployment.
            From there, the Super Admin registers each hospital and its first administrator, and every other
            account (doctors, nurses, staff) is created by that hospital's admin.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/70">Full name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                placeholder="Platform Super Admin"
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
                placeholder="superadmin@dripwatch.rw"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/70">Phone (optional)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-border/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                placeholder="+250 780 000 000"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/70">Password</label>
              <PasswordInput
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
              />
            </div>

            {error && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create Super Admin account'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink/50">
          Already set up?{' '}
          <Link to="/login" className="font-medium text-teal-600 hover:underline">
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
