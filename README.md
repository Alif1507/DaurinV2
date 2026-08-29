# Daurin

Daurin is a school cleanliness and waste-management platform. Students and
teachers can report problems and track their resolution, while staff and admins
manage reports, waste records, locations, users, and operational analytics.

The project includes a React frontend, a FastAPI backend, Supabase
authentication/database/storage, and CAMIDE image-based waste classification.

> [!IMPORTANT]
> This repository is a reusable template for a school reporting website. It is
> not preconfigured for one particular school. Each school administrator must
> configure its own locations, users, roles, sorting guidance, and operational
> data before the website is used by students and teachers.

## Template scope

Daurin currently assumes **one school per deployment and Supabase project**.
The database does not include tenant isolation for multiple schools in a single
deployment. Schools that require separate data must use separate deployments,
or extend the schema with a school/tenant identifier and matching access rules.

School-specific data is intentionally not treated as universal seed data:

- Locations such as classrooms, canteens, toilets, gardens, laboratories, and
  collection points must reflect the real school site.
- Admin and staff accounts must be assigned only to trusted school personnel.
- Waste-sorting guidance and CAMIDE operating instructions should follow the
  facilities and procedures available at that school.
- Reports, measurements, dashboard metrics, and uploaded photos belong to the
  school operating that deployment.
- School names, contact details, policies, and other public-facing copy should
  be reviewed before a production launch.

The application can start with no locations or operational records. This is
expected: the first administrator is responsible for completing the initial
school setup described below.

## Features

- Public Daurin landing page and waste-sorting education
- Supabase email authentication and automatic student-profile provisioning
- Role-based access for students, teachers, staff, and administrators
- Student/teacher cleanliness reporting with optional photo evidence
- Personal report history with `reported → in progress → resolved` tracking
- Staff/admin report workflow and resolution notes
- Waste weighing records and sorting guides
- Operational dashboards, trends, comparisons, and location performance
- CAMIDE classification for 10 material types, grouped into organic,
  inorganic, B3, and residual waste
- Private Supabase storage with short-lived signed image URLs
- Dockerized frontend and backend with health checks
- Swagger, ReDoc, structured errors, request IDs, and automated backend tests

## Role access

| Capability | Student | Teacher | Staff | Admin |
| --- | :---: | :---: | :---: | :---: |
| Create and track own reports | Yes | Yes | Yes | Yes |
| Use CAMIDE | Yes | Yes | Yes | Yes |
| View operational dashboard | No | No | Yes | Yes |
| Process all cleanliness reports | No | No | Yes | Yes |
| Record waste measurements | No | No | Yes | Yes |
| Manage locations and guides | No | No | No | Yes |
| Manage users and roles | No | No | No | Yes |

All protected frontend routes require a valid Supabase session. The backend
loads the authoritative role from `public.profiles`; roles supplied by clients
are ignored.

## Technology stack

### Frontend

- React 19 and Vite 8
- React Router
- TanStack Query and Axios
- Supabase JavaScript client
- Tailwind CSS 4
- Recharts
- Framer Motion
- React Three Fiber and Three.js

### Backend

- Python 3.12
- FastAPI and Uvicorn
- Pydantic Settings
- Supabase Python client
- PostgreSQL and Supabase Storage
- ONNX Runtime, Pillow, and NumPy
- Pytest

### Runtime

- Docker Compose
- Nginx for the production frontend image and `/api` reverse proxy

## Project structure

```text
.
├── backend/
│   ├── app/
│   │   ├── api/v1/          # FastAPI route modules
│   │   ├── core/            # Configuration, dependencies, and errors
│   │   ├── ml/              # CAMIDE model runtime
│   │   ├── repositories/    # Supabase persistence layer
│   │   ├── schemas/         # Request and response models
│   │   └── services/        # Application/business services
│   ├── supabase/migrations/ # Database schema, buckets, and indexes
│   ├── tests/               # Backend automated tests
│   ├── compose.yaml
│   ├── compose.prod.yaml
│   └── Dockerfile
├── frontend/
│   ├── public/              # Static images and assets
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── providers/
│   │   ├── services/
│   │   └── utils/
│   ├── Dockerfile
│   └── nginx.conf
└── README.md
```

## Prerequisites

- Docker Desktop with the Linux container engine running
- A Supabase project
- Git

For a non-Docker workflow, also install Python 3.12+ and Node.js 22+.

## Quick start with Docker

### 1. Configure Supabase

Create a Supabase project and collect:

- Project URL
- Anonymous/public key
- Service-role key

In the Supabase Dashboard, open **Authentication → Providers → Email** and turn
off **Confirm email**. Registration in this project is configured to create a
session immediately, so new users can continue without opening a verification
email.

The service-role key is privileged. Keep it in the backend only and never put
it in the React application.

### 2. Configure the backend

From the repository root:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env` and provide at least:

```env
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

The remaining settings already have development defaults in `.env.example`.

### 3. Apply database migrations

Run these files in numeric order using the Supabase SQL Editor or CLI:

1. `backend/supabase/migrations/001_daurin_mvp.sql`
2. `backend/supabase/migrations/002_camide.sql`
3. `backend/supabase/migrations/003_dashboard_indexes.sql`

The migrations create the application tables, indexes, private storage buckets,
and access restrictions required by the backend.

### 4. Configure CAMIDE

For real classification, place the verified ONNX model at:

```text
backend/app/ml/models/waste_classifier.onnx
```

The included model uses the Recylo 10-class profile. Configure it with:

```env
CAMIDE_MODEL_PROFILE=recylo_10class
CAMIDE_MODEL_LABELS=organic,inorganic,b3,residual
CAMIDE_MODEL_VERSION=recylo-sih-10class
CAMIDE_MOCK_CLASSIFIER=false
```

CAMIDE maps Recylo's hazardous subclasses to `b3`, non-recyclable waste to
`residual`, organic waste to `organic`, and recyclable subclasses to
`inorganic`. Model provenance, checksum, and license are documented in
`backend/app/ml/models/README.md`.

Classification results also include the most likely detailed type, such as
recyclable plastic, cardboard, metal, batteries, or e-waste. The UI translates
these types into Indonesian labels, familiar examples such as plastic bottles
and banana peels, confidence values, and disposal guidance. The current model
recognizes material groups rather than every individual object subtype.

For local API/UI testing without the model, set the following in
`backend/.env`:

```env
CAMIDE_MOCK_CLASSIFIER=true
```

Mock classification must not be enabled in production.

### 5. Start the application

```powershell
cd backend
docker compose up --build
```

Open:

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Health check | http://localhost:8000/health |

Useful Docker commands:

```powershell
# Run in the background
docker compose up --build -d

# Inspect service health
docker compose ps

# Follow logs
docker compose logs -f

# Stop and remove the containers
docker compose down
```

## Production-style Docker runtime

The production override removes the backend source bind mount, starts multiple
Uvicorn workers, and enables restart policies:

```powershell
cd backend
docker compose -f compose.yaml -f compose.prod.yaml up --build -d
```

Before deployment, set `APP_ENV=production`, configure the real frontend origin,
use production Supabase credentials, provide the CAMIDE model, and terminate TLS
at a trusted reverse proxy or hosting platform.

## Local development without Docker

### Backend

```powershell
cd backend
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Apply the Supabase migrations and configure `backend/.env` before starting the
API.

### Frontend

In another terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The local frontend uses `http://localhost:8000/api/v1` by default. Supabase's
public URL and anonymous key are loaded from `GET /api/v1/auth/config`; setting
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` is optional.

## Authentication and initial admin setup

New authenticated accounts are provisioned as active students on their first
authenticated API request. To bootstrap the first administrator:

1. Register and sign in normally.
2. Open an authenticated page once so the profile is provisioned.
3. In the Supabase SQL Editor, promote the trusted account:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

After the first admin exists, user roles can be managed through the protected
admin API. Inactive profiles are denied access even when their Supabase token is
otherwise valid.

### Configure the school data

After creating the first administrator, complete this onboarding sequence for
each school deployment:

1. Sign in as the administrator and open **Dashboard → Locations**.
2. Add every location that students and teachers may select in a report. Use
   names that are familiar at that school, for example `Kantin Utama`,
   `Laboratorium IPA`, or `Kelas 9A`.
3. Review registered users in **Dashboard → Users**. Assign trusted accounts to
   the `staff` or `admin` role through the protected Users API (available in
   Swagger) or the documented Supabase administrator workflow.
4. Review the waste-sorting guides through the protected Guides API, then check
   CAMIDE labels and local handling procedures before enabling daily use.
5. Ask staff to submit a test report with a photo, process it to completion, and
   confirm that the report, signed photo preview, and dashboard totals appear
   correctly.
6. Remove test data through an authorized administrator workflow before launch
   if it should not be included in the school's operational history.

Locations are managed by the administrator; staff can view location performance
but cannot create locations. Students and teachers should begin reporting only
after the administrator has completed the location list. Whenever rooms or
facilities change, the school administrator must keep this list up to date.

## Frontend routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page and waste education |
| `/login` | Public | Sign in |
| `/register` | Public | Student account registration |
| `/report` | Authenticated | Create a cleanliness report |
| `/my-reports` | Authenticated | Track personal reports |
| `/camide` | Authenticated | Camera-based waste identification |
| `/dashboard` | Staff/Admin | Operational summary |
| `/dashboard/reports` | Staff/Admin | Report workflow |
| `/dashboard/waste` | Staff/Admin | Waste records |
| `/dashboard/camide` | Staff/Admin | CAMIDE analytics |
| `/dashboard/locations` | Staff/Admin | Location performance |
| `/dashboard/users` | Admin | User administration |

## API overview

All application endpoints use the `/api/v1` prefix.

| Group | Base path | Purpose |
| --- | --- | --- |
| Authentication | `/auth` | Public auth config and current profile |
| Reports | `/reports` | Create, list, upload images, start, and resolve |
| Waste records | `/waste-records` | Record and manage waste weights |
| Locations | `/locations` | List and administer school locations |
| Guides | `/guides` | Waste-sorting guidance |
| CAMIDE | `/camide` | Identify waste images |
| Dashboard | `/dashboard` | Summaries, trends, and location analytics |
| Users | `/users` | Admin-only user management |

The frontend sends the Supabase access token on protected requests:

```http
Authorization: Bearer <supabase_access_token>
```

Use Swagger at `http://localhost:8000/docs` for the complete request and response
schema.

## Quality checks

### Backend tests

The test suite uses fakes and does not contact Supabase:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest
```

### Frontend checks

```powershell
cd frontend
npm run lint
npm run build
```

## Security notes

- Never commit `backend/.env` or the Supabase service-role key.
- Never expose the service-role key through a `VITE_*` variable.
- The React app does not access application tables directly; it uses FastAPI.
- Database tables have row-level security enabled and direct client access is
  revoked.
- Report images and optional CAMIDE images are stored in private buckets.
- Validate production CORS origins instead of using a wildcard.
- Keep `CAMIDE_MOCK_CLASSIFIER=false` in production.

## Troubleshooting

### Docker cannot connect to the engine

Start or restart Docker Desktop and wait for the Linux engine to report that it
is running, then retry `docker compose up --build`.

### Frontend opens but API requests fail

Check service health and logs:

```powershell
cd backend
docker compose ps
docker compose logs -f api
```

Confirm that `FRONTEND_ORIGIN` matches the browser origin and that all Supabase
values in `backend/.env` are configured.

### An authenticated user receives a profile or permission error

Confirm that `public.profiles` contains the Supabase Auth user ID, the profile is
active, and its role is one of `student`, `teacher`, `staff`, or `admin`.

### CAMIDE cannot load its model

Verify the ONNX file path, label order, model input contract, and
`CAMIDE_MODEL_PATH`. For local testing only, enable the mock classifier.

## Additional documentation

- [Backend documentation](backend/README.md)
- [Frontend documentation](frontend/README.md)
- [CAMIDE model contract](backend/app/ml/models/README.md)
