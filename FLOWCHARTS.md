# Daurin Application Flowcharts

These diagrams describe how users, containers, backend services, Supabase, and
the CAMIDE model interact. They reflect the current application behavior and
role restrictions.

## 1. System architecture and communication

```mermaid
flowchart LR
    USER["User browser"]
    NGINX["Frontend container<br/>Nginx"]
    REACT["React application"]
    API["FastAPI API<br/>/api/v1"]
    AUTH["Supabase Auth"]
    DB["Supabase PostgreSQL<br/>profiles and application data"]
    STORAGE["Private Supabase Storage<br/>report and resolution photos"]
    MODEL["Local ONNX model<br/>CAMIDE inference"]

    USER -->|"Pages and static assets"| NGINX
    NGINX --> REACT
    REACT -->|"Sign in or register"| AUTH
    AUTH -->|"Session and access token"| REACT
    REACT -->|"API request with Bearer token"| NGINX
    NGINX -->|"Proxy /api requests"| API
    API -->|"Validate access token"| AUTH
    API -->|"Read and write records"| DB
    API -->|"Store protected report evidence"| STORAGE
    API -->|"Classify image in memory"| MODEL
    API -->|"JSON response"| REACT
```

The React application uses Supabase directly only for authentication. All
application records are accessed through FastAPI, which loads the authoritative
role from `public.profiles` on protected requests.

## 2. Authentication and role-based routing

```mermaid
flowchart TD
    START["Open Daurin"] --> PUBLIC["Landing, login, or registration page"]
    PUBLIC --> PROTECTED["Open a protected page"]
    PROTECTED --> SESSION{"Valid Supabase session?"}
    SESSION -->|"No"| LOGIN["Redirect to login"]
    LOGIN --> SIGNIN["Sign in or register"]
    SIGNIN --> SESSION
    SESSION -->|"Yes"| PROFILE["GET /auth/me with Bearer token"]
    PROFILE --> EXISTS{"Profile exists?"}
    EXISTS -->|"No"| PROVISION["Create active student profile"]
    EXISTS -->|"Yes"| ACTIVE
    PROVISION --> ACTIVE{"Profile active?"}
    ACTIVE -->|"No"| DENIED["Access denied"]
    ACTIVE -->|"Yes"| ROLE{"Authoritative role"}

    ROLE -->|"Student or teacher"| MEMBER["Reports, My Reports, and CAMIDE"]
    ROLE -->|"Staff"| STAFF["Member pages plus operational dashboard"]
    ROLE -->|"Admin"| ADMIN["All pages plus locations and user management"]

    MEMBER --> API_GUARD["FastAPI repeats role check for every request"]
    STAFF --> API_GUARD
    ADMIN --> API_GUARD
```

Frontend route guards improve navigation, but FastAPI remains the security
boundary. A hidden or manually called route is still rejected when the profile
role is not permitted.

## 3. Cleanliness report lifecycle

```mermaid
flowchart TD
    REPORTER["Authenticated student, teacher, staff, or admin"]
    FORM["Choose active location, problem type, and description"]
    VALIDATE{"Input and location valid?"}
    CREATE["Create report"]
    REPORTED["Status: Reported"]
    PHOTO{"Attach initial photo?"}
    STORE_INITIAL["Validate and store photo<br/>in private storage"]
    QUEUE["Staff and admin report queue"]
    START["Staff or admin starts handling"]
    PROGRESS["Status: In progress<br/>handler and start time recorded"]
    COMPLETE["Add resolution note and required proof photo"]
    ALLOWED{"Allowed to complete?"}
    STORE_PROOF["Validate and store proof<br/>in private storage"]
    RESOLVED["Status: Resolved<br/>resolution time recorded"]
    HISTORY["Reporter views own history<br/>with short-lived signed photo URLs"]

    REPORTER --> FORM --> VALIDATE
    VALIDATE -->|"No"| FORM
    VALIDATE -->|"Yes"| CREATE --> REPORTED --> PHOTO
    PHOTO -->|"Yes"| STORE_INITIAL --> QUEUE
    PHOTO -->|"No"| QUEUE
    QUEUE --> START --> PROGRESS --> COMPLETE --> ALLOWED
    ALLOWED -->|"Assigned staff or any admin"| STORE_PROOF --> RESOLVED --> HISTORY
    ALLOWED -->|"Different staff member"| FORBIDDEN["403 Forbidden"]
    REPORTED --> HISTORY
    PROGRESS --> HISTORY
```

The valid status sequence is strictly `reported -> in_progress -> resolved`.
Report and completion photos are stored privately; the UI receives temporary
signed URLs instead of public storage paths.

## 4. CAMIDE waste identification

```mermaid
flowchart TD
    USER["Authenticated user"] --> CAPTURE["Capture or select an image"]
    CAPTURE --> UPLOAD["POST /camide/identify"]
    UPLOAD --> VALIDATE{"JPEG, PNG, or WebP<br/>within size and dimension limits?"}
    VALIDATE -->|"No"| ERROR["Return validation error"]
    VALIDATE -->|"Yes"| MEMORY["Decode image in memory"]
    MEMORY --> ONNX["Run local ONNX classifier"]
    ONNX --> MAP["Map detailed class to<br/>Organik, Anorganik, B3, or Residu"]
    MAP --> CONFIDENCE{"Confidence above threshold?"}
    CONFIDENCE -->|"Yes"| DETAIL["Use detailed object guidance"]
    CONFIDENCE -->|"No"| CATEGORY["Use safer category-level guidance"]
    DETAIL --> META["Save metadata only"]
    CATEGORY --> META
    META --> DISCARD["Discard image bytes<br/>no CAMIDE image storage"]
    DISCARD --> RESULT["Return label, examples, confidence, and disposal guidance"]
    META --> ANALYTICS["Staff and admin CAMIDE analytics"]
```

Stored metadata includes the user, category, detailed object label, confidence,
model version, and timestamp. The captured CAMIDE image is never written to
Supabase Storage.

## 5. Staff and administrator operations

```mermaid
flowchart TD
    REQUEST["Authenticated management request"] --> ROLE{"Profile role"}

    ROLE -->|"Student or teacher"| BLOCKED["403 Forbidden"]
    ROLE -->|"Staff"| STAFF_OP{"Staff operation"}
    ROLE -->|"Admin"| ADMIN_OP{"Admin operation"}

    STAFF_OP -->|"Reports"| REPORTS["View, start, and resolve assigned reports"]
    STAFF_OP -->|"Waste records"| STAFF_OWNER{"Updating or deleting own record?"}
    STAFF_OWNER -->|"Yes"| WASTE_WRITE["Create, read, update, or delete waste data"]
    STAFF_OWNER -->|"No"| BLOCKED
    STAFF_OP -->|"Analytics"| ANALYTICS["View dashboard and location performance"]

    ADMIN_OP -->|"Reports and waste"| FULL_OPS["Manage all operational records"]
    ADMIN_OP -->|"Locations"| LOCATIONS["Create, edit, or deactivate locations"]
    ADMIN_OP -->|"Sorting guides"| GUIDES["Manage waste guidance"]
    ADMIN_OP -->|"Users"| TARGET{"Target is already an admin?"}
    TARGET -->|"Yes"| PROTECTED["Reject change<br/>admin account protected"]
    TARGET -->|"No"| NEW_ROLE{"Selected role"}
    NEW_ROLE -->|"Student, teacher, or staff"| SAVE_ROLE["Update profile role"]
    NEW_ROLE -->|"Admin"| PROTECTED
```

Location deletion is implemented as deactivation so historical reports remain
intact. A staff member may create waste records but may only modify or delete
records they own; an administrator may manage all operational records.

## 6. Docker deployment and request flow

```mermaid
flowchart TD
    SOURCE["Project source and environment configuration"]
    COMPOSE["docker compose up -d --build"]
    FRONT_BUILD["Build React production assets"]
    API_BUILD["Build Python API and dependencies"]
    FRONT["Frontend container<br/>Nginx on port 80"]
    API["API container<br/>Uvicorn on port 8000"]
    API_HEALTH{"API health check passes?"}
    FRONT_HEALTH{"Frontend health check passes?"}
    READY["Daurin deployment ready"]
    CLIENT["Browser"]
    TLS["Optional VPS TLS reverse proxy"]
    STATIC{"Request path"}
    SUPABASE["Supabase services"]
    MODEL["Mounted or baked ONNX model"]

    SOURCE --> COMPOSE
    COMPOSE --> FRONT_BUILD --> FRONT
    COMPOSE --> API_BUILD --> API
    API --> API_HEALTH
    API_HEALTH -->|"No"| API_BUILD
    API_HEALTH -->|"Yes"| FRONT
    FRONT --> FRONT_HEALTH
    FRONT_HEALTH -->|"No"| FRONT_BUILD
    FRONT_HEALTH -->|"Yes"| READY

    CLIENT --> TLS --> FRONT --> STATIC
    STATIC -->|"Static page or asset"| CLIENT
    STATIC -->|"/api/*"| API
    API --> SUPABASE
    API --> MODEL
    API -->|"JSON"| FRONT --> CLIENT
```

In the provided Compose setup, the frontend is available on host port `5173`
and the API on host port `8000`. Inside the Docker network, Nginx proxies
`/api/*` to the `api:8000` service. A production VPS should terminate HTTPS at
a trusted reverse proxy before forwarding requests to the frontend container.

## Role summary

| Flow | Student | Teacher | Staff | Admin |
| --- | :---: | :---: | :---: | :---: |
| Create and track reports | Yes | Yes | Yes | Yes |
| Use CAMIDE | Yes | Yes | Yes | Yes |
| Process reports | No | No | Yes | Yes |
| Manage waste records | No | No | Own records | All records |
| View operational dashboards | No | No | Yes | Yes |
| Manage locations and guides | No | No | No | Yes |
| Change non-admin user roles | No | No | No | Yes |

