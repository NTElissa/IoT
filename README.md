# DripWatch — Smart IV Monitoring System

A full-stack prototype of the Smart Intravenous Monitoring System described in
*"Smart Intravenous Monitoring System for Modern Healthcare — A Case Study of
Remera Rukoma Hospital, Rwanda"* (NTIHINDUKA Elissa, 2026).

It simulates weight-based IV fluid level sensing, real-time multi-channel
alerts, and a nurse → support-staff task delegation workflow, wrapped in a
role-based web application (Admin / Doctor / Nurse / Support Staff).

---

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT auth
- **Frontend:** React (Vite), Tailwind CSS, React Router, Recharts, Socket.IO client
- **Simulation:** a server-side interval depletes active IV bags based on
  flow rate and raises alerts/escalations exactly like the physical sensor
  network described in the research would.

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
npm run seed              # populates demo users, rooms, patients, IV bags
npm run dev                # starts the API on http://localhost:5000
```

The seed script prints demo login credentials, for example:

```
Admin:   admin@remerarukoma.rw   / Admin@12345
Doctor:  doctor1@remerarukoma.rw / Doctor@12345
Nurse:   nurse1@remerarukoma.rw  / Nurse@12345
Support: support1@remerarukoma.rw / Support@12345
```

### Frontend

```bash
cd frontend
cp .env.example .env       # defaults already point at http://localhost:5000
npm install
npm run dev                 # starts the app on http://localhost:5173
```

Open http://localhost:5173. You can either sign in with a seeded account, or
visit **/register** to bootstrap a brand-new hospital's first administrator
account from scratch (registration is automatically locked after the first
admin exists — every other account must then be created by an admin from the
**Staff** page).

---

## 3. Quick start (Docker Compose)

```bash
docker compose up --build
```

This starts MongoDB, the backend API (port 5000), and the built frontend
(port 4173). Run the seed script once against the containerized database if
you want demo data:

```bash
docker compose exec backend npm run seed
```

Then open http://localhost:4173.

---

## 4. How the workflow maps to the research

| Research concept | Implementation |
|---|---|
| Weight-based monitoring model | `IVFluid.recalculateLevel()` / `ivCalculationService.js` — `(currentWeight - emptyBagWeight) / (initialWeight - emptyBagWeight) × 100` |
| Real-time fluid detection | `simulationService.js` ticks every `SIMULATION_TICK_MS` (default 8s), depleting each active bag by its configured flow rate and pushing updates over Socket.IO |
| Low / high alert thresholds | Configurable via `.env` (`LOW_FLUID_THRESHOLD`, `HIGH_FLUID_THRESHOLD`), default <10% / >90% |
| Wireless notifications | Dashboard (Socket.IO), simulated SMS (logged server-side and surfaced in the UI notification tray), simulated app push |
| Task delegation | Nurses/doctors delegate a bag-change task to support staff from the dashboard; support staff mark it in-progress/completed |
| Escalation | An unacknowledged alert past `ESCALATION_MINUTES` (default 10) automatically escalates to all administrators |
| Offline capability | Out of scope for this web prototype (the original design uses EEPROM + local buzzers on the physical device); this application instead focuses on the software layer that consumes sensor readings |
| Role-based access | Admins manage everything; doctors/nurses only see and act on rooms they are explicitly assigned to; support staff only see tasks delegated to them |

---

## 5. Roles in this application

- **Administrator** — registers patients, creates/deactivates doctor, nurse,
  and support-staff accounts, creates rooms, assigns doctors/nurses to rooms,
  assigns patients to rooms and care teams, views all reports.
- **Doctor** — sees only patients and rooms they are assigned to; can start
  and manage IV fluids in those rooms; views clinical reports.
- **Nurse** — same room-scoped access as doctors; the primary user of the
  alert → delegate workflow.
- **Support Staff** — sees only tasks delegated to them; changes bags and
  marks tasks complete.

---

## 6. API overview

All endpoints are namespaced under `/api/v1` and return
`{ success, message, data, timestamp }` (or `{ success: false, message,
error, timestamp }` on failure). See `backend/src/routes/*.js` for the full
list. Key groups:

```
/auth        register (bootstrap only) · login · me · logout
/users       admin-only staff account management
/patients    register/list/update patients
/rooms       create rooms, assign doctors/nurses
/iv-fluids   start/list/update IV bags, acknowledge alerts, log complications
/tasks       delegate, start, complete, escalate tasks
/alerts      flattened alert feed
/reports     overview, response-times, complications, workload, task-completion, iv-usage
```

---

## 7. Notes on the simulation

There is no physical hardware in this prototype — `simulationService.js`
stands in for the IoT sensor network, depleting bag weight over time exactly
per the weight-based formula from the research, so the UI, alerts, and
reports all behave as they would with real sensors attached.

---

## 8. Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list of
configurable values (ports, Mongo URI, JWT secret, alert thresholds,
escalation window, simulation tick interval, API/socket URLs).
