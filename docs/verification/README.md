# Verification evidence — Current Evaluation Pass

| Check | Result | Evidence |
| --- | --- | --- |
| Security / API regression pytest | 61 passed | `docs/verification/backend-results.txt`, `backend-tests.xml` |
| General admin/API CRUD | 37 passed | `docs/verification/backend-results.txt` |
| Client management workflow | 12 passed | `docs/verification/backend-results.txt` |
| Total backend tests | 110 passed, 0 failed | Ephemeral test runner (`scripts/run_evaluation_tests.py`) |
| Frontend regression tests | 17 passed, 5 suites | `frontend/src/utils/*.test.js`, `frontend/src/services/*.test.js`, `frontend/src/pages/ClientDashboard.test.jsx` |
| Production compilation | Passed (clean build, 322.81 kB gzip) | `frontend/build/` via `yarn build` |
| Secret Scanning | Clean (0 leaks, 0 private keys) | Automated repo scan in CI workflow |
| Frontend Dependency audit | 40 advisories in CRA build toolchain (8 Low, 23 Moderate, 9 High); full graph reports 41 (8 Low, 24 Moderate, 9 High); package-lock removed | `frontend/yarn.lock` (`yarn audit --groups dependencies`) |
| Python Dependency audit (Production Runtime) | 96 advisories across 16 runtime packages; dev tools (`black`, `pytest`) separated to `requirements-dev.txt` (6 additional advisories) | `backend/requirements.txt` via `pip-audit` |
| Dockerfile Container Hardening | Unprivileged non-root user `appuser` (UID 10001); installs runtime dependencies only; uploads permissions 750 | `Dockerfile` |
| Audit Trail Hash-Chain | Verified (unkeyed SHA-256 with process lock; tests cover intact, tampered, gap, limit, legacy, and mixed-log prevention) | `backend/utils/audit_logger.py`, `tests/backend/test_evaluation_security.py` |
| Rate Limiter Mode & State | Redis sliding-window with atomic check-and-record; reports `distributed_redis`, `degraded_in_memory_fallback`, or `in_memory_unconfigured` | `backend/utils/rate_limiter.py`, `tests/backend/test_evaluation_security.py` |
| Production Headers & CSP | Strict CSP pinned to known domains (`unsplash`, `pravatar`, `onrender`), HSTS `max-age=31536000`, `DENY` clickjacking, obsolete headers removed | `frontend/vercel.json`, `backend/server.py` |
| Product Security Transparency | Public `/security` page & Admin `/admin/security` center with honest evidence attribution | `frontend/src/pages/SecurityPrivacy.jsx`, `frontend/src/admin/pages/SecurityCenter.jsx` |

Backend execution runs against an isolated, ephemeral database (`metechq_evaluation_test_*`) with temporary upload directories created and cleanly dropped on exit by `scripts/run_evaluation_tests.py`. The frontend uses `frontend/yarn.lock` as the single authoritative lockfile matching CI (`yarn install --frozen-lockfile`).

Reproduction commands and operational boundary notes are in `../../THREATS.md` and `../../SECURITY_SETUP.md`. Server diagnostic logs are never exposed or published. Hosted TLS/CSP verification, multi-worker Redis rate limiting, and HttpOnly session cookies are documented as staged production roadmap items.
