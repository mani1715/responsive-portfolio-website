# Evaluator Verification & Demonstration Guide

This guide provides evaluators and reviewers with a safe, reproducible, step-by-step path to independently verify the implementation, security claims, test coverage, and functionality of **METECHQ**.

---

## 1. Evaluation Rubric & Deliverables Map

| Category | Weight | Evaluated Artifacts & Evidence |
| :--- | :---: | :--- |
| **Security** | 35 | • `SECURITY_SETUP.md`, `THREATS.md`, `/security`<br>• Dual HMAC-SHA256 JWT signing realms (`JWT_SECRET_KEY` vs `CLIENT_JWT_SECRET`) in `backend/auth.py`<br>• Server-side client tenant isolation in `backend/routes/client_portal.py`<br>• Sliding-window rate limiting with Redis fallback in `backend/utils/rate_limiter.py`<br>• Magic-byte binary upload inspection in `backend/utils/upload_validator.py`<br>• Cryptographic SHA-256 audit log hash-chaining in `backend/utils/audit_logger.py`<br>• Defensive HTTP headers (HSTS, CSP, XFO DENY, nosniff) in `frontend/vercel.json` and `backend/server.py` |
| **Threat Analysis & Testing** | 15 | • Threat model & risk register (`THREATS.md`) covering IDOR, credential attacks, cross-tenant leaks, uploads, XSS, and supply chain<br>• Isolated ephemeral backend test runner: **121 passed** (`python scripts/run_evaluation_tests.py`: 72 pytest + 37 admin CRUD + 12 client isolation)<br>• Frontend regression suite: **17 passed** across 5 test suites (`frontend/src/**/*.test.js`)<br>• Automated dependency audit baseline enforcement: `python scripts/check_dependency_audits.py` |
| **Functionality** | 15 | • Public portfolio with search, category filtering, and case studies (`/portfolio`, `/portfolio/:id`)<br>• 8 live interactive industry demos (E-commerce, SaaS, Real Estate, LMS, Corporate, Restaurant)<br>• Authenticated client workspace (`/client/dashboard`) with milestones, tasks, team, budget, authorized downloads, and real-time chat<br>• Authenticated admin panel (`/admin/dashboard`) with content editing, client/project provisioning, and Security Center (`/admin/security`) |
| **AI Usage & Prompt Documentation** | 15 | • `PROMPTS.md`: Chronologically ordered user prompts and engineering decisions with **strict zero-calendar-timestamp compliance**<br>• Transparent record of AI assistance, corrections, test fixes, and architectural boundaries |
| **Engineering Quality** | 10 | • Clean decoupled architecture: React SPA + FastAPI backend<br>• Authoritative lockfile: `frontend/yarn.lock` with frozen CI installs (`yarn install --frozen-lockfile`)<br>• Production compilation: Clean build (322.81 kB JS gzip, 77.0 kB CSS gzip)<br>• Safe error boundaries, loading skeletons, and bounded pagination |
| **Documentation, Deployment & Demo** | 10 | • `README.md`, `SECURITY_SETUP.md`, `THREATS.md`, `docs/EVALUATION_GUIDE.md`<br>• Live frontend on Vercel (`https://frontend-iota-mauve-57.vercel.app`)<br>• Live backend on Render (`https://metechq.onrender.com/api`)<br>• Live hosted header verification script (`scripts/verify_hosted_headers.py`) |

---

## 2. Environment Prerequisites & Setup

> [!TIP]
> **Complete Copy-and-Run Walkthrough:** For full terminal commands for Windows PowerShell and macOS/Linux Bash, see the dedicated **[Local Setup Guide](LOCAL_SETUP.md)**.

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.x or 20.x
- **Yarn**: 1.22.x
- **Git**: Installed
- **MongoDB**: Local MongoDB instance (or rely on the automated ephemeral runner which provisions an isolated test database)

### Local Setup Commands

```bash
# 1. Clone repository
git clone https://github.com/mani1715/Metechq.git
cd Metechq

# 2. Setup backend virtual environment and dependencies
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

pip install -r backend/requirements.txt
pip install -r backend/requirements-dev.txt

# 3. Setup frontend dependencies (frozen authoritative lockfile)
cd frontend
yarn install --frozen-lockfile
cd ..
```

---

## 3. Exact Verification Commands & Expected Outcomes

All tests run in an **isolated, ephemeral test environment** with synthetic test accounts. No real customer data is ever accessed, altered, or required.

### 1. Full Backend Evaluation Test Runner
Runs 121 tests against an isolated, temporary MongoDB database (`metechq_evaluation_test_*`), validating security middleware, RBAC, tenant isolation, audit hash chaining, rate limiting, and admin CRUD.

```bash
python scripts/run_evaluation_tests.py
```
- **Expected Outcome:** `All 121 tests passed (72 pytest + 37 admin CRUD + 12 client isolation). Exit code 0.`

### 2. Frontend Regression Test Suite
Runs unit tests for URL sanitization, XSS defense, client dashboard behavior, and API communication.

```bash
cd frontend
yarn test --watchAll=false --runInBand
cd ..
```
- **Expected Outcome:** `Test Suites: 5 passed, 5 total. Tests: 17 passed, 17 total. Exit code 0.`

### 3. Frontend Production Build
Compiles optimized production assets.

```bash
cd frontend
yarn build
cd ..
```
- **Expected Outcome:** `Compiled successfully. Exit code 0.`

### 4. Dependency Audit Baseline Check
Verifies dependency vulnerabilities against strict, documented baseline thresholds.

```bash
python scripts/check_dependency_audits.py
```
- **Expected Outcome:** `[AUDIT COMPLETED WITH FINDINGS]. Exit code 0.`
  - **Backend Runtime (`backend/requirements.txt` via `pip-audit`):** 96 advisories across 16 pinned packages awaiting major framework migration (all 16 documented). Dev tools (`black`, `pytest`) isolated in `requirements-dev.txt`.
  - **Frontend Toolchain (`frontend/yarn.lock` via `yarn audit --groups dependencies`):** 40 advisories (8 Low, 23 Moderate, 9 High, 0 Critical). All 9 High advisories reside in legacy CRA `react-scripts 5.0.1` build toolchain loaders; not reachable at runtime in browser client bundles.

### 5. Full-History Secret Scanning
Scans entire Git commit history using Gitleaks with a strictly narrowed allowlist.

```bash
gitleaks detect --source . -c .gitleaks.toml -v
```
- **Expected Outcome:** `No leaks found. Exit code 0.`

### 6. Live Hosted Security Headers Verification
Inspects live HTTP response headers across frontend routes, reverse-proxy routes, and direct backend APIs.

```bash
python scripts/verify_hosted_headers.py
```
- **Expected Outcome:** `✅ SUCCESS: All live hosted endpoints match defined security header policy. Exit code 0.`

---

## 4. Security Claim to Evidence Mapping

| Security Claim | Plain Language Control | Evidence Source | Scope of Verification | Documented Limitation | Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dual Token Realms** | Admin and client tokens use separate HMAC-SHA256 signing keys and claims (`type: 'admin'` vs `type: 'client'`). | `backend/auth.py`, `tests/backend/test_comprehensive_security.py` (`test_jwt_realm_separation`) | Backend token verification middleware | Tokens are stored in browser `localStorage` (accessible to JS). CSP does not eliminate all XSS risk. | **Verified by automated test** |
| **Client Tenant Isolation** | Client portal queries strictly filter by authenticated `client_id`; cross-tenant access is blocked. | `backend/routes/client_portal.py`, `tests/backend/client_management_test.py` (`test_client_project_isolation`) | Client portal projects, tasks, comments, files | Private client portal scope; public showcase projects are intentionally public. | **Verified by automated test** |
| **Login Rate Limiting** | Sliding window limits login attempts (5 per 5 minutes per IP). Supports Redis across workers with in-memory fallback. | `backend/utils/rate_limiter.py`, `tests/backend/test_comprehensive_security.py` (`test_rate_limiter_simultaneous_concurrency`) | `/api/admins/login` and `/api/client/login` | Default in-memory mode is process-local; multi-worker clusters require `REDIS_URL`. | **Verified by automated test** |
| **Upload Inspection** | Magic byte validation, extension allowlist, SVG script rejection, 15MB size limit, UUID disk filenames, traversal containment. | `backend/utils/file_security.py`, `tests/backend/test_comprehensive_security.py` (`test_unsafe_uploads_rejected`) | All backend file upload handlers | Local filesystem storage; multi-instance clustering requires external object storage. | **Verified by automated test** |
| **Audit Hash Chaining** | Append-only audit records linked via unkeyed SHA-256 hash chaining to detect application-level mutations. | `backend/utils/audit_logger.py`, `tests/backend/test_evaluation_security.py` (6 regression tests) | MongoDB `audit_logs` collection | Unkeyed SHA-256 does not protect against a privileged MongoDB DBA rewriting raw data. Append lock is process-local. | **Verified by automated test** |
| **Defensive HTTP Headers** | Strict HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, CSP. | `frontend/vercel.json`, `backend/server.py`, `scripts/verify_hosted_headers.py` | Vercel CDN edge and FastAPI middleware | Edge CDN caching can delay header updates until deployment is aliased. | **Verified against live deployment** |
| **CI Supply Chain Integrity** | Automated CI pipeline enforces frozen lockfile installs, secret scanning, tests, and audit baselines. | `.github/workflows/ci.yml`, `scripts/check_dependency_audits.py` | GitHub Actions workflow on `main` branch | CI verifies reproducible builds; CRA toolchain findings await planned Vite migration. | **Verified by CI** |
| **Responsible Disclosure** | Intake channel via Studio Contact Form (`/contact`) and GitHub Security Advisory. | `frontend/src/pages/SecurityPrivacy.jsx`, `/contact` | Public security reporting channel | Dedicated `security@metechq.com` is pending domain MX DNS configuration. | **Documented but not verified** |

---

## 5. Hosted Header Evidence: Three-Way Separation

To avoid confusion between configuration files, CI build artifacts, and live edge responses, evidence is strictly separated into three tiers:

```
                    ┌──────────────────────────────────────────────┐
                    │ 1. Local / Repository Evidence               │
                    │    • frontend/vercel.json                    │
                    │    • backend/server.py (FastAPI middleware)  │
                    │    • Dockerfile container headers            │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │ 2. CI Verification Evidence                  │
                    │    • .github/workflows/ci.yml                │
                    │    • GitHub Actions test & audit logs        │
                    │    • Frozen lockfile compliance              │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │ 3. Live Hosted Evidence                      │
                    │    • https://frontend-iota-mauve-57.vercel.app│
                    │    • https://metechq.onrender.com/api        │
                    │    • scripts/verify_hosted_headers.py (live) │
                    └──────────────────────────────────────────────┘
```

1. **Local / Repository Evidence:**
   - `frontend/vercel.json` defines exact production headers for all static and HTML routes.
   - `backend/server.py` defines `SecurityHeadersMiddleware` enforcing `SAMEORIGIN`, `nosniff`, and CORS validation.
2. **CI Evidence:**
   - GitHub Actions runs full backend test suites, frontend test suites, Gitleaks secret scanning, and baseline audit evaluations on every push.
3. **Live Hosted Evidence:**
   - Evaluated by executing `python scripts/verify_hosted_headers.py` directly against the live URLs.
   - **Current Live Status:** `✅ SUCCESS` (live edge responses match all required security header directives).

---

## 6. Safe Manual Testing Plan (Synthetic Data Only)

> [!IMPORTANT]
> **Safety Notice:** Evaluators must perform testing only in the local test environment or using non-sensitive synthetic accounts. Never attempt destructive actions (DDoS, data deletion) or probe production databases.

### Test A: Dual Token Realm Verification
1. Start backend: `uvicorn backend.server:app --port 8000`.
2. Authenticate as client at `POST /api/client/login` with synthetic credentials (`demo_client / DemoClient123!`).
3. Obtain client JWT token.
4. Attempt to query administrative endpoint: `GET /api/admins/security-overview` with `Authorization: Bearer <client_token>`.
5. **Expected Outcome:** HTTP `401 Unauthorized` or `403 Forbidden` (`Admin privileges required`).

### Test B: Client Tenant Isolation
1. Obtain synthetic tokens for Client A and Client B.
2. Using Client B's token, attempt to access Client A's project details: `GET /api/client/projects/<client_a_project_id>`.
3. **Expected Outcome:** HTTP `404 Not Found` or `403 Forbidden` (`Project not found or access denied`).

### Test C: Malicious File Upload Rejection
1. Attempt to upload an SVG file containing `<script>alert(1)</script>` or a `.php` file renamed to `.png` (without magic bytes).
2. **Expected Outcome:** HTTP `400 Bad Request` (`Invalid file format or active content detected`).

---

## 7. Recommended Evaluator Demonstration Sequence (7 Minutes)

### Step 1: Public Visitor Flow (2 Minutes)
1. Open the homepage: [https://frontend-iota-mauve-57.vercel.app](https://frontend-iota-mauve-57.vercel.app).
2. Observe the clear value proposition: Independent digital design studio with public showcase, client workspace, and admin suite.
3. Scroll to **03 / THE PLATFORM AT A GLANCE**: Review the 3 segregated spaces (Showcase, Client Workspace, Admin Suite).
4. Scroll to **05 / DATA INTEGRITY & PRIVACY**: Observe the compact, accessible security summary.
5. Click **View Security Disclosures** to navigate to `/security`.
6. Navigate to **Our work (`/portfolio`)**: Test search, filtering, and open case studies (Aishu Foods, Photography & Creative Portfolio). Test live demo links.

### Step 2: Client Workspace Flow (2 Minutes)
1. Navigate to `/client/login`.
2. Sign in with demonstration credentials.
3. View the authenticated workspace:
   - **Overview Tab:** Project status, deliverables, start/due dates.
   - **Milestones Tab:** Phased delivery tracking.
   - **Tasks Tab:** Filter tasks by status.
   - **Files Tab:** Authorized project file downloads (authorized via server-side tenant token).
   - **Chat Tab:** Real-time project messaging.

### Step 3: Admin Management & Security Center (2 Minutes)
1. Navigate to `/admin/login`.
2. Sign in with administrative credentials.
3. Open **Security Center (`/admin/security`)**:
   - Inspect live control statuses (`Verified`, `Needs attention`, `Not verified`).
   - Review the live cryptographic SHA-256 audit log hash-chain scan.
   - Inspect dependency tracking (runtime vs build toolchain baselines).

### Step 4: Terminal Reproducibility (1 Minute)
1. Run `python scripts/run_evaluation_tests.py` in the terminal to observe all 121 backend tests passing cleanly.
2. Run `python scripts/verify_hosted_headers.py` to confirm live hosted header compliance.
