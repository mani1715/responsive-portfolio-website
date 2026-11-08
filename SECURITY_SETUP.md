# 🔐 METECHQ Security Architecture & Configuration Guide

This document defines the security architecture, configuration standards, and deployment hardening rules for the **METECHQ** agency and client portal platform.

---

## 1. Security Architecture Summary

METECHQ implements defense-in-depth across the application lifecycle:

1. **Dual Secret Domain Isolation**:
   - `JWT_SECRET`: Admin dashboard authentication.
   - `CLIENT_JWT_SECRET`: Independent client portal authentication.
   - Distinct HMAC-SHA256 signing keys; tokens are **cryptographically signed, not encrypted**. Mutual exclusion checks prevent cross-realm access.

2. **Automated Configuration Validation**:
   - `backend/config.py` runs `validate_config()` on application startup.
   - In `ENVIRONMENT=production`, the application refuses to start if placeholder or default secrets are detected.
   - Minimum secret length is enforced (>= 32 characters).

3. **Strict RBAC & Resource Ownership (Zero IDOR)**:
   - All administrative routes (`/admin/*`, `/projects`, `/services`, `/contacts/admin/*`, `/pages`, `/content`, `/settings`, `/admins`) require authenticated admin tokens with valid claims.
   - Client portal endpoints enforce tenant isolation: clients can only query and mutate projects, documents, and tasks assigned to their specific `client_id`.
   - Super-admin authorization (`require_super_admin`) is strictly required for admin user provisioning, audit log retrieval, and chain integrity verification.

4. **Sliding-Window Rate Limiting**:
   - Implemented via `backend/utils/rate_limiter.py`.
   - Admin and client login endpoints enforce strict brute-force limits (5 failed attempts per 5-minute sliding window per client IP).
   - Rate limiting operates in-memory per worker process; production multi-worker deployment requires `REDIS_URL`.

5. **Multi-Layer File & Upload Security**:
   - Implemented via `backend/utils/file_security.py`.
   - Extension allowlisting (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.zip`).
   - Magic byte MIME verification: checks file binary header against declared extension.
   - Active content scanning: SVG files are checked for embedded `<script>`, `javascript:`, and malicious event attributes (`onload=`).
   - Strict size limiting: 15MB file ceiling.
   - Path traversal prevention: UUID-prefixed randomized filenames; sanitized disk paths.
   - Authenticated private downloads: files are served via `/api/client/projects/{id}/files/{file_id}/download` requiring active ownership token.

6. **Defense-in-Depth HTTP Headers**:
   - `X-Content-Type-Options: nosniff` (MIME sniffing disabled).
   - `X-Frame-Options: SAMEORIGIN` (Clickjacking mitigation).
   - `Referrer-Policy: strict-origin-when-cross-origin`.
   - `Permissions-Policy: geolocation=(), camera=(), microphone=()`.

7. **Audit Log Integrity Checking**:
   - Implemented in `backend/utils/audit_logger.py`.
   - Records actor ID, username, action, resource, IP address, and status.
   - Every mutation entry contains an unkeyed SHA-256 hash incorporating the previous entry's hash.
   - **Boundary plainly noted:** Unkeyed hash-chaining with process-local append locking detects application-level mutations, omissions, and sequence disruptions. It does NOT prevent a database administrator with direct raw MongoDB write access from rewriting the chain, nor does a process-local lock guarantee concurrency across multiple worker processes without external synchronization.

---

## 2. Authoritative Environment Variables Specification

| Variable | Required in Prod | Description | Supported Aliases |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Yes | `production`, `staging`, `development`, or `test` | - |
| `MONGODB_URI` | Yes | Production MongoDB connection string | `MONGO_URL` |
| `DB_NAME` | Yes | Database name (`metechq`) | - |
| `JWT_SECRET_KEY` | Yes | 32+ char secret for Admin tokens | `JWT_SECRET`, `SECRET_KEY` |
| `CLIENT_JWT_SECRET`| Yes | 32+ char secret for Client tokens | `CLIENT_JWT_SECRET_KEY` |
| `CORS_ORIGINS` | Yes | Comma-separated list of allowed origins | `ALLOWED_ORIGINS` |
| `UPLOAD_DIR` | No | Absolute or relative upload directory | - |
| `INIT_SUPERADMIN_USERNAME` | No | Initial super-admin username (default `admin`) | - |
| `INIT_SUPERADMIN_PASSWORD` | Required on init | Bootstrap password for initial super-admin | - |
| `REDIS_URL` | Optional | Redis connection URI for distributed rate limiting | - |

---

## 3. Secret Generation & Key Rotation

### Generating Cryptographic Secrets
Run in your secure terminal:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Or with OpenSSL:
```bash
openssl rand -hex 32
```

### Rotating Compromised Secrets
1. Generate new strings for `JWT_SECRET` and `CLIENT_JWT_SECRET`.
2. Update the environment variables in your hosting provider (Render, Railway, AWS ECS, or Docker Compose).
3. Restart the backend service.
4. All existing tokens will be immediately invalidated, forcing active sessions to re-authenticate with the database.

---

## 4. Verification & Security Testing

Run the automated security runner to execute tests against an isolated ephemeral database:

```bash
# Full isolated runner (59 pytest regression + 37 admin CRUD + 12 client management = 108 total passed)
python scripts/run_evaluation_tests.py

# Frontend regression test suite (17 passed)
cd frontend
yarn test --watchAll=false --runInBand

# Production compilation check
yarn build

# Dependency audits
yarn audit --groups dependencies
cd ..
python -m pip_audit -r backend/requirements.txt
```

---

## 5. Security Transparency Views

1. **Public "Security & Privacy" Page (`/security`)**:
   - Plain-language explanation of signed JWT authentication realms, client project data isolation, file integrity controls, and responsible disclosure intake.
   - Reports verified mechanisms without marketing hype, database-proof claims, or false certification claims.

2. **Admin-Only "Security Center" (`/admin/security`)**:
   - Accessible only by authorized administrators.
   - Backed by authenticated endpoint `GET /api/admins/security-overview`.
   - Displays live status rows (`Verified`, `Needs attention`, `Not verified`) with linked code files, evidence types, verification scopes, and test references.
   - Performs real-time cryptographic audit chain integrity checks with complete vs truncated scan detection.

---

## 6. Staged Hardening Roadmap

1. **Session Cookies Migration**:
   - Currently, tokens are stored in browser `localStorage`.
   - *Target architecture*: Migrate to `HttpOnly`, `Secure`, `SameSite=Strict` cookies issued by FastAPI backend on authentication, eliminating browser JavaScript access to session tokens.
2. **Distributed Rate Limiting & Concurrency**:
   - Configure a managed Redis instance (`REDIS_URL`) to unify sliding-window rate tracking and distributed audit append locking across multiple backend replicas.
3. **Frontend Build Toolchain Modernization**:
   - Migrate from Create React App (`react-scripts 5.0.1`) to Vite to eliminate legacy build-time transitive dependencies (`webpack-dev-middleware`, `postcss v7/v8`, `svgo v1`).
