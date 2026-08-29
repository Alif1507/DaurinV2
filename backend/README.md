# Daurin Backend

FastAPI backend for cleanliness reporting and school waste management. Supabase provides Auth, PostgreSQL, and private object storage.

## Features

- Supabase access-token verification and active-profile checks
- Role-based access control for student, teacher, staff, and admin
- Cleanliness report creation, ownership, workflow, and image upload
- Waste records and waste sorting guides
- Location and user administration
- Dashboard summaries, comparisons, trends, CAMIDE analytics, and location performance
- Structured errors, request IDs, CORS allowlist, Swagger, and ReDoc
- Docker development and production runtime

## Local setup

1. Create a Python virtual environment and install dependencies:

   ```bash
   python -m venv .venv
   .venv/Scripts/activate  # Windows
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and add the Supabase URL, anon key, and service-role key. Never place the service-role key in the React project.

3. Apply every SQL file in `supabase/migrations` in numeric order through the Supabase SQL editor or CLI.

4. Run the API:

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. Open:

   - API: `http://localhost:8000`
   - Swagger: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## Docker

Development:

```bash
docker compose up --build
```

This starts both services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

Production-style runtime:

```bash
docker compose -f compose.yaml -f compose.prod.yaml up --build -d
```

## Authentication

The frontend signs in with Supabase Auth and sends the returned access token:

```http
Authorization: Bearer <supabase_access_token>
```

Roles are always loaded from `public.profiles`; roles supplied by clients are ignored.

## Tests

Tests do not contact Supabase:

```bash
pytest
```

## Deployment notes

- Configure an explicit production `FRONTEND_ORIGIN` (comma-separated values are accepted).
- Keep `report-images` private; the API produces short-lived signed URLs on report detail responses.
- Run the migration before the API receives traffic.
- Docker is not installed automatically by this repository.
