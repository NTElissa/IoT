import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplets, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const RegisterPage = () => {
  const { registerFirstAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerFirstAdmin(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="rounded-lg bg-teal-600 p-1.5 text-white">
            <Droplets size={20} />
          </div>
          <span className="font-display text-lg font-semibold text-ink">DripWatch</span>
        </Link>

        <div className="rounded-2xl border border-black/5 bg-white p-7 shadow-card">
          <h1 className="font-display text-xl font-semibold text-ink">Set up your hospital</h1>
          <p className="mt-1 text-sm text-ink/50">
            This creates the first administrator account. Every other account — doctors, nurses, support
            staff — is created by an admin afterward.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/70">Full name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                placeholder="Dr. Jean Bosco Musabe"
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
                placeholder="admin@yourhospital.rw"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/70">Phone (optional)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                placeholder="+250 780 000 000"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/70">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                placeholder="At least 6 characters"
              />
            </div>

            {error && <p className="rounded-lg bg-crit/5 px-3 py-2 text-sm text-crit">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create administrator account'}
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
