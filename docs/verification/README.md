# Verification evidence — Current Evaluation Pass

| Check | Result | Evidence |
| --- | --- | --- |
| Security / API regression pytest | 59 passed | `docs/verification/backend-results.txt`, `backend-tests.xml` |
| General admin/API CRUD | 37 passed | `docs/verification/backend-results.txt` |
| Client management workflow | 12 passed | `docs/verification/backend-results.txt` |
| Total backend tests | 108 passed, 0 failed | Ephemeral test runner (`scripts/run_evaluation_tests.py`) |
| Frontend regression tests | 17 passed, 5 suites | `frontend/src/utils/*.test.js`, `frontend/src/services/*.test.js`, `frontend/src/pages/ClientDashboard.test.jsx` |
| Production compilation | Passed (clean build, 322.16 kB gzip) | `frontend/build/` via `yarn build` |
| Frontend Dependency audit | 40 advisories in CRA build toolchain (8 Low, 23 Moderate, 9 High); package-lock removed | `frontend/yarn.lock` (yarn audit --groups dependencies) |
| Python Dependency audit | 102 advisories across 18 packages (multipart resolved; runtime compatibility updated) | `backend/requirements.txt` via `pip-audit` |
| Audit Trail Hash-Chain | Verified (unkeyed SHA-256 with process lock; tests cover intact, tampered, gap, limit, legacy) | `backend/utils/audit_logger.py`, `tests/backend/test_evaluation_security.py` |
| Product Security Transparency | Public `/security` page & Admin `/admin/security` center | `frontend/src/pages/SecurityPrivacy.jsx`, `frontend/src/admin/pages/SecurityCenter.jsx` |

Backend execution runs against an isolated, ephemeral database (`metechq_evaluation_test_*`) with temporary upload directories created and cleanly dropped on exit by `scripts/run_evaluation_tests.py`. The frontend uses `frontend/yarn.lock` as the authoritative lockfile matching CI (`yarn install --frozen-lockfile`).

Reproduction commands and operational boundary notes are in `../../THREATS.md` and `../../SECURITY_SETUP.md`. Server diagnostic logs are never exposed or published. Hosted TLS/CSP verification, multi-worker Redis rate limiting, and HttpOnly session cookies are documented as staged production roadmap items.
