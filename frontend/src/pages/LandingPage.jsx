import React from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets,
  Gauge,
  BellRing,
  Users2,
  ShieldCheck,
  ArrowRight,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import IVDripAnimation from '../components/common/IVDripAnimation.jsx';

const steps = [
  {
    n: '01',
    title: 'A sensor watches the bag',
    body: 'A weight-based reading tracks fluid level continuously, the same measurement a nurse would take by hand — just never blinking.',
  },
  {
    n: '02',
    title: 'The system raises the alarm',
    body: 'Below 10% or above 90%, the dashboard, a simulated SMS, and the app all notify the assigned nurse at once.',
  },
  {
    n: '03',
    title: 'A nurse delegates the change',
    body: 'One tap sends the bag-change task to available support staff, with the room and fluid type already attached.',
  },
  {
    n: '04',
    title: 'Completion is logged',
    body: 'Support staff confirm the change on the dashboard. If nothing happens in time, it escalates to a supervisor automatically.',
  },
];

const roles = [
  { title: 'Administrators', body: 'Register patients, create staff accounts, assign rooms and IV fluids, review every report.' },
  { title: 'Doctors', body: 'See only their assigned rooms and patients, prescribe IV therapy, monitor fluid status at a glance.' },
  { title: 'Nurses', body: 'Watch assigned rooms in real time, acknowledge alerts, delegate bag changes in one tap.' },
  { title: 'Support Staff', body: 'Receive delegated tasks with room and bed details, confirm each one on completion.' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-mist text-ink">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-teal-600 p-1.5 text-white">
            <Droplets size={20} />
          </div>
          <span className="font-display text-lg font-semibold">DripWatch</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-ink/70 hover:text-ink">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-card transition-colors hover:bg-teal-700"
          >
            Set up hospital
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 md:grid-cols-2 md:py-16">
        <div>
          <p className="font-mono-data text-xs uppercase tracking-wider text-teal-600">
            Remera Rukoma Hospital · Smart IV Monitoring
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Manual IV checks miss things. This doesn't blink.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/60">
            Every ward round, a nurse walks the corridor checking bags by eye. DripWatch replaces the
            guesswork with a live reading of every bag on the floor — catching a near-empty line or a fluid
            overload the moment it happens, and routing the fix to whoever can act fastest.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-medium text-white shadow-card transition-colors hover:bg-teal-700"
            >
              Set up your hospital <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-5 py-3 text-sm font-medium text-ink/70 transition-colors hover:bg-mist"
            >
              I already have an account
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          <IVDripAnimation />
        </div>
      </section>

      {/* Problem stats */}
      <section className="border-y border-black/5 bg-white py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 sm:grid-cols-3">
          <div>
            <p className="font-display text-3xl font-semibold text-teal-600">24/7</p>
            <p className="mt-1 text-sm text-ink/50">Continuous fluid-level watch, no manual rounds required.</p>
          </div>
          <div>
            <p className="font-display text-3xl font-semibold text-teal-600">3 channels</p>
            <p className="mt-1 text-sm text-ink/50">Dashboard, SMS, and app notifications reach staff wherever they are.</p>
          </div>
          <div>
            <p className="font-display text-3xl font-semibold text-teal-600">1 tap</p>
            <p className="mt-1 text-sm text-ink/50">Delegate a bag change to support staff without leaving the dashboard.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold text-ink">How a single alert moves</h2>
        <p className="mt-2 max-w-xl text-sm text-ink/50">
          Order matters here — this is the real sequence an alert follows from sensor to closed task.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-black/5 bg-white p-5 shadow-card">
              <span className="font-mono-data text-xs text-teal-500">{s.n}</span>
              <h3 className="mt-2 font-display text-base font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/50">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-ink">One system, four sets of eyes</h2>
          <p className="mt-2 max-w-xl text-sm text-ink/50">
            Everyone sees exactly what their role needs — nothing more.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <div key={r.title} className="rounded-2xl bg-mist p-5">
                <Users2 size={18} className="text-teal-600" />
                <h3 className="mt-3 font-display text-base font-semibold text-ink">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/50">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Gauge size={20} className="mt-0.5 shrink-0 text-teal-600" />
            <div>
              <h3 className="font-display text-base font-semibold text-ink">Weight-based accuracy</h3>
              <p className="mt-1 text-sm text-ink/50">Level is derived from real bag weight, not a guessed drip rate.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <BellRing size={20} className="mt-0.5 shrink-0 text-teal-600" />
            <div>
              <h3 className="font-display text-base font-semibold text-ink">Escalation built in</h3>
              <p className="mt-1 text-sm text-ink/50">An unacknowledged alert reaches a supervisor automatically.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <WifiOff size={20} className="mt-0.5 shrink-0 text-teal-600" />
            <div>
              <h3 className="font-display text-base font-semibold text-ink">Built for patchy connectivity</h3>
              <p className="mt-1 text-sm text-ink/50">Designed around the intermittent connectivity common to the setting.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-teal-600" />
            <div>
              <h3 className="font-display text-base font-semibold text-ink">Role-based access</h3>
              <p className="mt-1 text-sm text-ink/50">Staff can only act on the rooms they're actually assigned to.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Smartphone size={20} className="mt-0.5 shrink-0 text-teal-600" />
            <div>
              <h3 className="font-display text-base font-semibold text-ink">Works on any device</h3>
              <p className="mt-1 text-sm text-ink/50">Fully responsive, from the nursing-station tablet to a phone in a pocket.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Droplets size={20} className="mt-0.5 shrink-0 text-teal-600" />
            <div>
              <h3 className="font-display text-base font-semibold text-ink">Full audit trail</h3>
              <p className="mt-1 text-sm text-ink/50">Every bag hung, changed, or removed is logged for reporting.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 py-8 text-center text-xs text-ink/40">
        DripWatch — a Smart IV Monitoring System prototype for Remera Rukoma Hospital, Rwanda.
      </footer>
    </div>
  );
};

export default LandingPage;
