# Local Development & Evaluation Setup Guide

This guide provides step-by-step, copy-and-run instructions to set up, configure, run, and test **METECHQ** in a local development environment.

Instructions are provided for **Windows PowerShell** first, followed by **macOS & Linux (Bash)**.

---

## 1. Prerequisites & Version Requirements

Ensure the following tools are installed on your machine before proceeding:

| Dependency | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Python** | 3.10.x | 3.10.x / 3.11.x | `python --version` or `py -3.10 --version` |
| **Node.js** | 18.x LTS | 18.x or 20.x LTS | `node --version` |
| **Yarn** | 1.22.x | 1.22.22 | `yarn --version` |
| **MongoDB** | 6.0+ | MongoDB Community 7.0+ or Docker | `mongod --version` or `docker --version` |
| **Git** | 2.x | Latest | `git --version` |

> [!NOTE]
> **Test Environment Isolation:** You do **not** need to manually populate a database to run tests. The automated test runner (`python scripts/run_evaluation_tests.py`) automatically provisions an isolated, disposable database (`metechq_evaluation_test_*`), runs all 121 tests, and cleanly drops the database on exit. Only a running MongoDB server is required.

---

## 2. Start Local MongoDB

The backend requires a local MongoDB connection on port `27017`. Choose either Option A (Docker) or Option B (Local Service).

### Option A: Using Docker (Recommended for quick testing)

#### Windows PowerShell:
```powershell
# Start local MongoDB container (detached)
docker run -d --name metechq-mongo -p 27017:27017 -v metechq_mongo_data:/data/db mongo:7

# Verify the container is running healthy
docker ps --filter "name=metechq-mongo"
```

#### macOS / Linux Bash:
```bash
# Start local MongoDB container (detached)
docker run -d --name metechq-mongo -p 27017:27017 -v metechq_mongo_data:/data/db mongo:7

# Verify the container is running healthy
docker ps --filter "name=metechq-mongo"
```

### Option B: Using Installed MongoDB Community Service

If you installed MongoDB as an OS service:
- **Windows:** Run `net start MongoDB` from an Administrator PowerShell, or ensure the service is running in `services.msc`.
- **macOS:** `brew services start mongodb/brew/mongodb-community`
- **Linux (Ubuntu/Debian):** `sudo systemctl start mongod`

---

## 3. Windows PowerShell Setup & Run Instructions

Open two separate PowerShell terminal windows.

### Terminal 1: Backend Setup & Server

From the repository root directory (`MSPN DEV\responsive-portfolio-website-main` or `Metechq`):

```powershell
# 1. Ensure you are in the repository root
cd "C:\my projects\MSPN DEV\responsive-portfolio-website-main"

# 2. Create Python 3.10 virtual environment
py -3.10 -m venv .venv

# 3. Activate the virtual environment
.\.venv\Scripts\Activate.ps1

# 4. Upgrade pip and install all backend runtime + dev dependencies
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt -r backend/requirements-dev.txt

# 5. Configure local backend environment from template
Copy-Item backend/.env.example backend/.env

# 6. Run the full isolated evaluation test suite (validates 121 tests against ephemeral DB)
python scripts/run_evaluation_tests.py

# 7. Start the FastAPI backend server (from the backend directory to resolve bare imports)
cd backend
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8002
```

The backend server is now running at **`http://127.0.0.1:8002`** (API base: `http://127.0.0.1:8002/api/`).

---

### Terminal 2: Frontend Setup & Dev Server

Open a second PowerShell terminal:

```powershell
# 1. Navigate to the frontend directory
cd "C:\my projects\MSPN DEV\responsive-portfolio-website-main\frontend"

# 2. Configure local frontend environment from template
Copy-Item .env.example .env

# 3. Install frontend dependencies from the authoritative frozen lockfile
yarn install --frozen-lockfile

# 4. Run the frontend regression tests (17 passed)
yarn test --watchAll=false --runInBand

# 5. Start the React development server
yarn start
```

The frontend application will compile and open at **`http://localhost:3003`**.

---

## 4. macOS & Linux (Bash) Setup & Run Instructions

Open two separate Bash terminal windows.

### Terminal 1: Backend Setup & Server

From the repository root directory:

```bash
# 1. Navigate to repository root
cd path/to/Metechq

# 2. Create Python 3.10 virtual environment
python3.10 -m venv .venv

# 3. Activate the virtual environment
source .venv/bin/activate

# 4. Upgrade pip and install all backend runtime + dev dependencies
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt -r backend/requirements-dev.txt

# 5. Configure local backend environment from template
cp backend/.env.example backend/.env

# 6. Run the full isolated evaluation test suite (validates 121 tests against ephemeral DB)
python scripts/run_evaluation_tests.py

# 7. Start the FastAPI backend server (from the backend directory)
cd backend
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8002
```

---

### Terminal 2: Frontend Setup & Dev Server

Open a second Bash terminal:

```bash
# 1. Navigate to the frontend directory
cd path/to/Metechq/frontend

# 2. Configure local frontend environment from template
cp .env.example .env

# 3. Install frontend dependencies from the authoritative frozen lockfile
yarn install --frozen-lockfile

# 4. Run frontend regression tests
yarn test --watchAll=false --runInBand

# 5. Start the React development server
yarn start
```

---

## 5. Local Environment Variables Explained

### Backend (`backend/.env`)

When copying `backend/.env.example` to `backend/.env`, the default values are pre-configured for local offline development:

| Variable | Local Default | Purpose |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `development` | Disables strict production checks so non-destructive dev fallbacks operate safely. |
| `HOST` | `127.0.0.1` | Local interface binding. |
| `PORT` | `8002` | Local API listener port. |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017` | Local MongoDB instance URI. **Never put production credentials here.** |
| `DB_NAME` | `metechq` | Local database name. |
| `JWT_SECRET_KEY` | *(Generated or 32+ char dev string)* | Admin realm signing key. In `development`, a deterministic fallback operates if left blank. |
| `CLIENT_JWT_SECRET` | *(Generated or 32+ char dev string)* | Client realm signing key. Distinct from admin key. |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:3003,http://127.0.0.1:3000,http://127.0.0.1:3003` | Permits requests from local frontend ports. |
| `UPLOAD_DIR` | `uploads` | Local directory for private file uploads. |
| `INIT_SUPERADMIN_PASSWORD` | *(Optional in dev)* | If left blank in `development`, the server securely generates a temporary bootstrap password on first run. |
| `REDIS_URL` | *(Leave empty)* | Omit for local development. Rate limiting will safely operate in-memory. |

### Frontend (`frontend/.env`)

| Variable | Local Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3003` | Local React development server port. |
| `BROWSER` | `none` | Prevents automatic browser launch on `yarn start`. |
| `REACT_APP_BACKEND_URL` | `http://localhost:8002/api` | Points frontend Axios calls directly to the local FastAPI backend. |

---

## 6. Expected Local URLs

Once both backend and frontend servers are running, access the following URLs in your browser:

| Interface | Local URL | Description |
| :--- | :--- | :--- |
| **Public Homepage** | [http://localhost:3003/](http://localhost:3003/) | Landing page with 3-space platform overview and compact security summary. |
| **Our Work / Portfolio** | [http://localhost:3003/portfolio](http://localhost:3003/portfolio) | Showcase case studies (Aishu Foods, Photography Studio, etc.). |
| **Interactive Demos** | [http://localhost:3003/demo/ecommerce](http://localhost:3003/demo/ecommerce) | Live interactive industry showcases. |
| **Security & Privacy** | [http://localhost:3003/security](http://localhost:3003/security) | Public evidence-based disclosures and architecture limits. |
| **Client Portal Sign-In** | [http://localhost:3003/client/login](http://localhost:3003/client/login) | Tenant-isolated client project workspace login. |
| **Admin Panel Sign-In** | [http://localhost:3003/admin/login](http://localhost:3003/admin/login) | Administrative suite and Content Editor. |
| **Admin Security Center** | [http://localhost:3003/admin/security](http://localhost:3003/admin/security) | Real-time audit log hash-chain verification and dependency monitoring. |
| **Backend API Health Check** | [http://127.0.0.1:8002/api/](http://127.0.0.1:8002/api/) | Returns JSON status `{ "status": "healthy" }`. |
| **Interactive Swagger Docs** | [http://127.0.0.1:8002/docs](http://127.0.0.1:8002/docs) | Interactive OpenAPI documentation for all API routes. |

---

## 7. How to Stop Local Processes & Clean Up

### Stopping the Servers
- In each terminal window (Backend and Frontend), press **`Ctrl + C`** to stop the respective process.

### Stopping the Docker MongoDB Container
When finished testing:

```bash
# Stop the MongoDB container
docker stop metechq-mongo

# Remove the container
docker rm metechq-mongo

# (Optional) Remove the persistent volume if you want a complete reset
docker volume rm metechq_mongo_data
```

---

## 8. Common Local Startup Errors & Troubleshooting

### 1. `ModuleNotFoundError: No module named 'database'`
- **Cause:** Running `uvicorn backend.server:app` from the project root. `backend/server.py` uses module-relative bare imports (`from database import ...`).
- **Solution:** Change into the `backend` directory before running Uvicorn:
  ```powershell
  cd backend
  python -m uvicorn server:app --reload --host 127.0.0.1 --port 8002
  ```

### 2. `ServerSelectionTimeoutError` / `ConnectionRefusedError`
- **Cause:** The backend cannot reach MongoDB at `127.0.0.1:27017`.
- **Solution:** Verify that your MongoDB service or Docker container is active:
  ```powershell
  docker ps --filter "name=metechq-mongo"
  # Or start it:
  docker start metechq-mongo
  ```

### 3. Port `8002` or `3003` Already in Use (`EADDRINUSE` / `[Errno 10048]`)
- **Cause:** A previously launched instance is still running in the background.
- **Solution (Windows PowerShell):**
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8002).OwningProcess | Stop-Process -Force
  ```
- **Solution (macOS / Linux):**
  ```bash
  lsof -ti:8002 | xargs kill -9
  ```

### 4. Yarn Package Manager Mismatch or Lockfile Warnings
- **Cause:** Installing with npm or updating dependencies without frozen lockfile.
- **Solution:** Always use Yarn with `--frozen-lockfile` to honor `frontend/yarn.lock`:
  ```bash
  cd frontend
  yarn install --frozen-lockfile
  ```

---

## 9. Important Note on `scripts/verify_hosted_headers.py`

> [!IMPORTANT]
> **Hosted Verifier Scope:** The script `scripts/verify_hosted_headers.py` is designed to inspect the **live production URLs** on Vercel (`https://frontend-iota-mauve-57.vercel.app`) and Render (`https://metechq.onrender.com/api/`).
>
> It is **not** a local test; it validates real cloud CDN edge caching, SSL/TLS certificates, and reverse-proxy headers after deployment.
> For local verification of code and application security, run:
> ```bash
> python scripts/run_evaluation_tests.py
> cd frontend && yarn test --watchAll=false --runInBand
> ```
