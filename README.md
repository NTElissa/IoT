# DripWatch — Multi-Tenant Smart IV Monitoring System

A full-stack, multi-hospital prototype of the Smart Intravenous Monitoring
System described in *"Smart Intravenous Monitoring System for Modern
Healthcare — A Case Study of Remera Rukoma Hospital, Rwanda"* (NTIHINDUKA
Elissa, 2026), extended into a platform that can onboard many hospitals,
each with its own isolated staff, patients, rooms, and IV fluid records.

It simulates weight-based IV fluid level sensing, real-time multi-channel
alerts, a nurse/doctor → staff task delegation workflow, and a five-tier
role hierarchy: **Super Admin → Admin → Doctor / Nurse / Staff Member**.

---

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT auth
- **Frontend:** React (Vite), Tailwind CSS, React Router, Recharts, Socket.IO client
- **Auth:** password + JWT, WebAuthn passkeys (`@simplewebauthn`), Google Sign-In
  (`google-auth-library`), TOTP 2FA (`speakeasy`), rate limiting + account
  lockout + `helmet` + a login audit log
- **SMS:** Africa's Talking gateway integration (simulated/logged if no API key is set)
- **Simulation:** a server-side interval depletes active IV bags based on
  flow rate and raises alerts/escalations exactly like the physical sensor
  network described in the research would.

---

## Role hierarchy

```
Super Admin
  └─ registers hospitals + each hospital's first Admin
     Admin (per hospital)
       ├─ registers/manages Doctors, Nurses, Staff Members, other Admins
       ├─ can change any hospital user's role
       ├─ can activate/deactivate or permanently delete a hospital user
       ├─ creates rooms, patients, IV fluids
       └─ assigns doctors/nurses to rooms, and doctors/nurses to patients
     Doctor / Nurse
       ├─ only see rooms/patients they're assigned to
       ├─ can register a brand-new patient (auto-assigned to themselves)
       ├─ start, pause/resume, and manage IV fluids for their patients
       └─ delegate bag-change tasks to Staff Members
     Staff Member
       └─ sees and completes only the tasks delegated to them
     Patient (self-service portal, not hospital-staff)
       ├─ signs in with a Patient ID instead of an email/password account
       ├─ views their own room, care team, allergies, vitals, and IV status
       └─ messages their care team in the shared per-patient chat
```

Every hospital's data (users, rooms, patients, IV fluids, tasks, event
logs, notifications) is fully isolated from every other hospital's — a
Super Admin never sees clinical data, and an Admin/Doctor/Nurse/Staff
Member never sees another hospital's records, even by direct link
guessing (every query is scoped server-side by hospital ID).

---

## Project structure

```
smart-iv-monitoring/
├── backend/       Express API, MongoDB models, Socket.IO, simulation engine
├── frontend/      React + Vite + Tailwind single-page application
├── docker/        Dockerfiles for backend and frontend
├── docker-compose.yml
└── README.md
```

---

## 1. Prerequisites

- Node.js 18+ and npm
- MongoDB running locally, or a MongoDB Atlas connection string
- (Optional) Docker + Docker Compose, if you'd rather not install Node/Mongo locally

---

## 2. Quick start (local, no Docker)

### Backend

```bash
cd backend
cp .env.example .env      # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed               # populates a super admin, 2 demo hospitals, staff, patients, IV bags
npm run dev                 # starts the API on http://localhost:5000
```

The seed script prints demo login credentials, for example:

```
Super Admin: superadmin@dripwatch.rw / SuperAdmin@12345
--- Remera Rukoma Hospital ---
Admin:   admin@remerarukoma.rw / Admin@12345
Doctor:  doctor1@remerarukoma.rw / Doctor@12345
Nurse:   nurse1@remerarukoma.rw / Nurse@12345
Staff:   staff1@remerarukoma.rw / Staff@12345
Patient: Patient ID printed by the seed script / Patient@12345 (use the "Patient sign-in" tab on the Login page)
--- Kibagabaga District Hospital (multi-tenancy demo) ---
Admin:   admin@kibagabaga.rw / Admin@12345
```

### Frontend

```bash
cd frontend
cp .env.example .env       # defaults already point at http://localhost:5000
npm install
npm run dev                 # starts the app on http://localhost:5173
```

Open http://localhost:5173. Sign in with a seeded account, or visit
**/register** to bootstrap a brand-new deployment's Super Admin account from
scratch (this is a one-time step — registration is automatically locked
after the first Super Admin exists). From there:

1. The Super Admin registers a hospital and its first Admin (`/hospitals`).
2. That Admin signs in and creates doctors, nurses, and staff members, plus
   rooms, patients, and IV fluids (`/staff`, `/rooms`, `/patients`, `/iv-fluids`).
3. Doctors and nurses work day-to-day from their own scoped dashboard.

---

## 3. Quick start (Docker Compose)

```bash
docker compose up --build
```

Starts MongoDB, the backend API (port 5000), and the built frontend (port
4173). Run the seed script once against the containerized database if you
want demo data:

```bash
docker compose exec backend npm run seed
```

Then open http://localhost:4173.

---

## 4. Patient portal, care-team chat, and clinical safety features

- **Patients can use the system themselves.** Registering a patient
  auto-generates a globally-unique Patient ID (`patientCode`, e.g.
  `P-7K2M9X`). A doctor, nurse, or admin can then grant that patient a
  portal login (Patients page → key icon) by setting a password - the
  patient signs in via a dedicated "Patient sign-in" tab on the Login page
  using their Patient ID instead of an email. Their portal (`/portal`)
  shows their own room/care-team info, allergies, latest vitals, current
  IV fluid status, and lets them message their care team - nothing else.
  Access can be revoked at any time without deleting the underlying
  patient record.
- **Care-team chat.** One running conversation per patient. The assigned
  doctor, assigned nurse, any staff member currently delegated a task for
  that patient, and the patient themselves (if portal access is enabled)
  can all read and post - scoped precisely, not hospital-wide, and pushed
  live over the same Socket.IO connection as everything else.
- **Vitals tracking.** Doctors/nurses log temperature, heart rate,
  respiratory rate, blood pressure, and oxygen saturation readings from a
  patient's History view; the trend (not just the latest number) is what
  actually helps catch deterioration early, so it's charted over time
  rather than just displayed as a single value.
- **Allergies.** A dedicated field on every patient record, surfaced as a
  prominent warning banner everywhere that patient's chart is opened -
  exactly where it matters before administering a new IV fluid or
  medication.
- **Hospitals are disabled, not casually deleted.** A Super Admin's normal
  tool is "Disable hospital" (blocks every login tied to it without
  touching its data). Permanent deletion is only reachable once a hospital
  is already disabled, and requires typing its exact name to confirm -
  both enforced server-side, not just hidden in the UI.
- **A scoping gap I found and fixed while building this:** `staff` (and now
  `patient`) accounts could previously see every IV fluid, alert, and task
  in the whole hospital through those list endpoints, not just the ones
  relevant to them. Now properly scoped to their own assignments/tasks.

## 5. Sign-in, security, and dark mode

- **Dark mode.** A toggle (sun/moon icon) is available on every page,
  including pre-login. Implemented via CSS variables behind Tailwind's
  `ink`/`mist`/`surface`/`border` tokens, so the whole app adapts without
  per-page overrides; preference is remembered in `localStorage` and
  otherwise follows the OS setting on first visit.
- **Fingerprint / passkey sign-in (WebAuthn).** From the Security page,
  anyone can register their device's fingerprint, face unlock, or a
  hardware security key, then sign in with it instead of a password from
  the Login page. Built on `@simplewebauthn/server` / `@simplewebauthn/browser`.
  **This was written and syntax-checked but never exercised against a real
  browser/authenticator in this environment - test it yourself before
  relying on it, and note WebAuthn requires `WEBAUTHN_RP_ID` to exactly
  match your frontend's hostname (no scheme/port) and a secure context
  (`https://`, or `http://localhost` for local dev).**
- **Google Sign-In.** Verifies a Google ID token server-side and signs in
  an *existing* account whose email matches - it never creates a new
  account, keeping account provisioning fully in the hands of admins/Super
  Admin. Hidden automatically if `GOOGLE_CLIENT_ID` / `VITE_GOOGLE_CLIENT_ID`
  aren't configured.
- **Two-factor authentication (TOTP).** Optional per-account, set up from
  the Security page with any authenticator app (Google Authenticator, Authy,
  1Password, etc.) via a QR code. Once enabled, every password/passkey/Google
  login is gated on a valid 6-digit code before a real access token is issued.
- **Account lockout.** After `MAX_LOGIN_ATTEMPTS` (default 5) failed
  password attempts, the account is temporarily locked for `LOCK_MINUTES`
  (default 15).
- **Rate limiting** on every credential-checking endpoint (login, passkey,
  Google, 2FA) to blunt automated brute-forcing.
- **Security headers** via `helmet`.
- **Login audit log.** Every sign-in attempt (successful or not, whatever
  the method) is recorded with its outcome, IP, and user agent. Hospital
  admins see their own hospital's history; the Super Admin sees
  platform-wide activity - both from the Security page.

## 6. Key behaviors implemented

- **Room-scoped nurse picker.** When a doctor registers or edits a patient
  and picks a room, the "Assigned nurse" list narrows to the nurses
  actually assigned to that room (falling back to the full hospital nurse
  list until a room is chosen).
- **Doctors and nurses can move their own patients between rooms.** Both
  admins and the patient's assigned doctor/nurse can change `room`/`bed` on
  `PUT /api/v1/patients/:id`. If the new room isn't one they're formally
  assigned to yet, they're added to it automatically (same pattern as
  registering a new patient), and the move is logged
  (`patient_room_changed` event).
- **Admins assign staff members to rooms too**, alongside doctors and
  nurses (`PATCH /api/v1/rooms/:id/assign-staff` now accepts `staffIds`).
- **Delegating a task always offers every staff member** in the hospital
  (not just ones tied to a specific room) - a doctor or nurse can delegate
  a bag change to any available staff member.
- **Patient comments & medications.** Doctors/nurses assigned to a patient
  (or an admin) can add free-text comments or structured medication/drug
  entries (`drugName`, `dosage`, `frequency`, `instructions`) from the
  patient's History view (`POST /api/v1/patients/:id/notes`).
- **Search everywhere.** Patients, Rooms, Staff, Tasks, and IV Fluids pages
  all have a client-side search bar (by name, room number, ward, role,
  email, fluid type, etc.).
- **Reports for doctors and nurses too**, not just admins - scoped to their
  own patients, rooms, and delegated tasks rather than hospital-wide totals
  (workload stays admin-only, since it's a staffing-management view).

- **Hospital onboarding.** `POST /api/v1/hospitals` (Super Admin only)
  creates a hospital and its first Admin account in one call. Suspending a
  hospital (`PUT /api/v1/hospitals/:id { isActive: false }`) immediately
  locks out every account tied to it. Deleting a hospital cascades to every
  user, room, patient, IV fluid, task, event log, and notification that
  belonged to it.
- **Role changes.** `PATCH /api/v1/users/:id/role` lets an Admin move a
  user between doctor/nurse/staff/admin. Changing someone out of
  doctor/nurse automatically drops them from any room assignments so access
  control stays consistent.
- **Doctor-registered patients.** `POST /api/v1/patients` now accepts the
  `doctor` role too — the doctor is auto-set as the assigned doctor, and if
  they picked a room they weren't yet formally assigned to, they're added
  to that room's staff automatically.
- **One open IV fluid per patient, with an explicit override.**
  `POST /api/v1/iv-fluids` checks whether the patient already has a bag in
  an open state (active/inactive/alert_low/alert_high). If so, it responds
  `409` with a warning message and the existing bag's details instead of
  silently creating a second one — this is what stops two different nurses
  or doctors from double-assigning fluid to the same patient at the same
  time. Resubmitting the same request with `force: true` ends the existing
  bag and starts the new one.
- **Pause/resume monitoring.** `PATCH /api/v1/iv-fluids/:id/toggle-active`
  lets a doctor/nurse/admin pause an active bag (e.g. patient off the ward)
  without ending it, and resume it later from the same weight/flow rate.
- **Persisted, scoped notifications.** Every alert, escalation, and task
  event creates a `Notification` row for exactly the staff who should see
  it (the room's assigned doctor(s)/nurse(s), or the relevant admin) —
  never anyone in another hospital, and never a doctor/nurse who isn't
  assigned to that patient. The bell icon in the top bar shows an unread
  count, a readable history, and mark-as-read / mark-all-read actions.
- **Real SMS.** `backend/src/services/smsProviderService.js` integrates
  Africa's Talking. It's simulated (console-logged) until you set
  `AT_USERNAME`/`AT_API_KEY` in `backend/.env`. The seed script assigns two
  real phone numbers provided during setup — `+250738382033` to the demo
  hospital's admin, `+250781832092` to its first nurse — so live delivery
  can be tested end-to-end once credentials are configured. **This
  integration was written and syntax-checked but never executed against
  Africa's Talking's live API in this environment (no outbound network
  access here) — verify it against your own account before relying on it.**
- **Admin account management.** Admins can permanently delete a hospital
  user (blocked for their own account and for the last remaining admin in
  that hospital) in addition to the existing activate/deactivate toggle —
  useful for marking a nurse unavailable without losing their history.
- **Show/hide password.** Login, registration, hospital admin creation, and
  staff account forms all have an eye-icon toggle.

---

## 7. How the workflow maps to the research

| Research concept | Implementation |
|---|---|
| Weight-based monitoring model | `IVFluid.recalculateLevel()` / `ivCalculationService.js` — `(currentWeight - emptyBagWeight) / (initialWeight - emptyBagWeight) × 100` |
| Real-time fluid detection | `simulationService.js` ticks every `SIMULATION_TICK_MS` (default 8s), depleting each active bag by its configured flow rate |
| Low/high alert thresholds | Configurable via `.env` (`LOW_FLUID_THRESHOLD`, `HIGH_FLUID_THRESHOLD`), default <10% / >90% |
| Wireless notifications | Dashboard (Socket.IO), real/simulated SMS, persisted in-app notifications with a bell icon |
| Task delegation | Nurses/doctors delegate a bag-change task to staff members; staff mark it in-progress/completed |
| Escalation | An unacknowledged alert past `ESCALATION_MINUTES` (default 10) automatically escalates to that hospital's admins |
| Role-based access | Doctors/nurses only see and act on rooms/patients they're assigned to; staff only see delegated tasks; admins are scoped to their own hospital; Super Admin manages hospitals, not clinical data |

---

## 8. API overview

All endpoints are namespaced under `/api/v1` and return
`{ success, message, data, timestamp }` (or `{ success: false, message,
error, data, timestamp }` on failure — `data` may carry extra context, e.g.
the existing bag on a 409 IV-fluid conflict).

```
/auth          register (bootstrap Super Admin only, one-time) · login · patient-login · google · me · logout
/auth/webauthn register-options/register-verify (add a passkey, requires login) · credentials (list/delete)
               login-options/login-verify (sign in with an existing passkey, public)
/auth/2fa      setup/confirm/disable (requires login) · verify-login (public, second step of login)
/hospitals     Super Admin only: create hospital+admin, list, update (disable) · delete (disabled hospitals only, requires confirmName match, cascades)
/users         Admin only, hospital-scoped: create, update, change role, reset password, permanent delete
/patients      register/list/update patients (admin or doctor, room changes by admin or assigned doctor/nurse)
               GET /:id/history (IV fluids, tasks, event log, notes) · GET/POST /:id/notes (comments & medications)
               POST/DELETE /:id/portal-access (grant/revoke a patient's own login)
               GET/POST /:id/messages · PATCH /:id/messages/read (care-team ↔ patient chat)
               GET/POST /:id/vitals (doctor/nurse log readings; patient can view their own)
/rooms         create rooms, assign doctors/nurses/staff (assign-staff accepts doctorIds/nurseIds/staffIds)
/iv-fluids     start (409 + force flow on conflict) · toggle-active · change-bag · remove · DELETE (admin) · acknowledge alerts · complications
/tasks         delegate (to any hospital staff member), start, complete, escalate tasks
/alerts        flattened alert feed
/reports       overview (all roles) · response-times, complications, task-completion, iv-usage (admin/doctor/nurse, scoped for non-admins) · workload (admin only)
/notifications list (with unread count), mark one read, mark all read
/security      login-events (admin: own hospital, super_admin: platform-wide)
```

---

## 9. Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list:
ports, Mongo URI, JWT secret, alert thresholds, escalation window,
simulation tick interval, Africa's Talking SMS credentials, and API/socket
URLs.

---

## 10. Suggested future enhancements

DripWatch covers the core IV-monitoring workflow end-to-end, but a
production hospital system tends to grow toward things intentionally left
out of this build to keep scope honest:

- Appointment/bed scheduling and admission/discharge workflows beyond the
  current simple admitted/discharged status
- A pharmacy/inventory module (this build tracks medications as chart
  notes, not stock levels)
- Lab results and imaging integration
- Billing/insurance
- Refresh-token rotation and session revocation (current sessions rely on
  JWT expiry only)
- WebAuthn backup/recovery codes for 2FA in case an authenticator device is lost

None of these are implemented - flagging them here rather than pretending
otherwise.
