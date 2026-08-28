# RE-SCHOOL Frontend

React/Vite frontend for the Daurin landing page, authenticated CAMIDE camera, and staff/admin dashboard.

## Run locally

```bash
npm install
npm run dev
```

## Docker

The repository Compose configuration builds this app as static files served by
Nginx. From the `backend` directory, start the complete application with:

```bash
docker compose up --build
```

Open `http://localhost:5173`. Nginx proxies `/api` requests to the backend
container, so the browser does not need to know the internal Docker hostname.

Dashboard, reporting, report history, and CAMIDE routes require a valid Supabase
session. Role checks and profile status are enforced by the backend.

The frontend uses `http://localhost:8000/api/v1` by default. Override it with:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Supabase login configuration is loaded safely from `GET /api/v1/auth/config`. You may alternatively set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never place the Supabase service-role key in this directory.

Routes:

- `/` — public landing page
- `/login` — Supabase login
- `/dashboard` — staff/admin dashboard
- `/camide` — authenticated camera identification
- `/report` — student/teacher cleanliness report form
- `/my-reports` — personal report history and progress

## Checks

```bash
npm run lint
npm run build
```
