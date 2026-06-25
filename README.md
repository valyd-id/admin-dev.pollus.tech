# Valyd Developer Portal — Admin Console (`admin-dev.pollus.tech`)

Back-office for the **dev.pollus.tech** developer portal. Admins sign in with
**email + password** and can view & manage **everything** in the portal:

- **Dashboard** — totals (developers, projects, pending, active), 14-day signup
  trend, projects-by-status, scope usage, latest projects.
- **Projects** — every OAuth project across all developers. Search + filter by
  status, one-click **Approve**, full **edit** (name, scopes, origins, redirect
  URIs, MCP webhook), status control (pending/active/inactive), **delete**, and
  view of `client_id` / `client_secret`.
- **Developers** — every portal user, with project counts, verification badge,
  full profile, and the list of projects they own.

## Stack
- Vite + React + TypeScript, Tailwind + shadcn/ui (design system shared with the
  dev portal frontend), **Framer Motion** for transitions/animations,
  TanStack Query, axios, Recharts.
- Backend: new `/api/admin/*` blueprint inside the existing **dev.pollus.tech**
  Flask app (`backend/app/routes/admin_routes.py`). Same Postgres `dev_db`.
  Admin auth = bcrypt password (`Admin` model) → JWT in an httpOnly `admin_access`
  cookie, signed with `ADMIN_SECRET_KEY` (separate from developer tokens).

## Local development
```bash
npm install
npm run dev            # http://localhost:5174  (proxies /api -> 127.0.0.1:8001)
```
The local Flask backend must be running on :8001 (systemd `dev-pollus.service`).

## Create / reset an admin
From `dev.pollus.tech/backend`:
```bash
venv/bin/python seed_admin.py --email javier@valyd.id --password 'YOUR_PASSWORD' --name 'Javier'
```
Re-running with an existing email updates that admin's password. Omit
`--password` to auto-generate one (printed once).

## Deploy (production)
DNS for `admin-dev.pollus.tech` already points at this server.
```bash
npm run build
sudo bash deploy/go-live.sh   # installs nginx site + certbot TLS, reloads nginx
```
`deploy/admin-dev.pollus.tech.nginx` serves `dist/` and proxies `/api/` to the
existing backend on `127.0.0.1:8001`.
