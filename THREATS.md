# Threat model and security verification

Scope: repository code audit and isolated ephemeral test harness. This document reflects verified controls and explicit boundaries; it does not claim certification, third-party audit, or 100% vulnerability-free status.

## System and trust boundaries

A public React SPA communicates with a FastAPI backend over HTTP locally (HTTPS required for production deployments). FastAPI accesses MongoDB and a private local or mounted volume storage for client project assets.
Three distinct trust levels exist:
1. Public visitors (unauthenticated)
2. Administrative operators (role-based permissions, super-admin vs granular admin)
3. Client portal users (strictly isolated by `client_id` tenant scoping)

The browser environment, submitted JSON payloads, URL query parameters, filenames, and uploaded file binaries are untrusted inputs. Database models validate schemas upon ingestion. Protected assets include credentials, JWT keys, client company information, confidential project deliverables, attachments, and private messages.

## Threat register and control verification

| Threat / impact | Controls in this revision | Verification and remaining limits |
| --- | --- | --- |
| Spoofing: forged, expired or wrong-realm JWT; account takeover | Dual signing keys (`JWT_SECRET` vs `CLIENT_JWT_SECRET`), required claims (`id`, `exp`, `type`), active DB lookup, account status checks | Verified by `test_jwt_realm_separation` and `test_admin_security_overview_requires_authentication`. No MFA or distributed token revocation blacklist yet implemented. |
| Elevation: client B reads client A project or files | Strict `client_id` query constraints on projects, tasks, comments, chat, and file downloads | Verified by `test_client_project_isolation` (cross-client requests return 404/401). |
| Elevation: restricted administrator edits protected resources | Role and permission checks (`require_super_admin`, granular flags `canManageClients`, `canManagePortfolio`, `canManageSettings`) | Verified by `test_restricted_admin_cannot_manage_clients_or_portfolio` (403 returned). Granular permissions cover core workflows. |
| Information disclosure: private portfolio items exposed publicly | MongoDB query filters enforce `is_private: false` for unauthenticated requests; private records excluded from public pagination | Verified by `test_public_portfolio_pagination_and_private_exclusion`. Detail endpoint conceals private items without admin token. |
| Tampering/XSS: stored HTML or dangerous link schemas | DOMPurify client-side sanitization; Pydantic model rejects dangerous schemes (`javascript:`, `data:`, credentialed URLs) | Verified by `test_project_unsafe_links_rejected` and frontend tests `contentSecurity.test.js` & `projectUrls.test.js`. |
| Tampering: upload traversal, disguised executables, active SVG | Extension allowlist, magic byte MIME sniffing, SVG script/event rejection, UUID disk names, directory containment | Verified by `test_unsafe_uploads_rejected`, `test_both_gif_signatures_accepted`, `test_upload_size_limit`, `test_generated_upload_path_confined`. File signatures do not substitute for an offline antivirus engine. |
| Tampering: administrative audit log alteration | Append-only MongoDB collection with SHA-256 cryptographic hash-chaining linking every mutation to the prior entry | Verified by `GET /api/admins/security-overview` and `verify_audit_log_chain()` live hash validation. |
| Spoofing: public administrator bootstrap | Public initialization endpoint returns HTTP 410; bootstrap handled via protected startup config | Verified by `test_public_admin_bootstrap_disabled`. Production deployments must remove bootstrap env vars after provisioning. |
| Denial of service: login brute-force | Sliding-window in-memory rate limiter (5 failed attempts per 5 minutes per IP); pagination max limit capped | Verified in login flow. Operates per-process; requires Redis (`REDIS_URL`) for horizontal multi-worker clusters. |
| Supply-chain compromise | npm audit fix applied (resolved 27 vulnerabilities; 39 remaining in CRA build toolchain); pip-audit performed on backend dependencies | CRA dev-dependencies execute during build only; Python dependencies require staged minor upgrades in production. |
| Security visibility | Public "Security & Privacy" page (`/security`); Admin-only "Security Center" (`/admin/security`) | Verified in UI routes and protected backend endpoint `/api/admins/security-overview`. |

## Reproduce verification

From the repository root with local Python, Node.js, and MongoDB:

```powershell
# 1. Run backend security & functional test runner (ephemeral DB)
python scripts/run_evaluation_tests.py

# 2. Run frontend regression tests
cd frontend
npm test -- --watchAll=false

# 3. Production compilation check
npm run build
```

## Production readiness and release criteria

Local automated regression tests confirm that the engineered controls behave as designed. Deployment requires the following operational steps:
1. Environment configuration: generate distinct 32+ character secrets for `JWT_SECRET` and `CLIENT_JWT_SECRET`.
2. Exact CORS configuration: restrict `CORS_ORIGINS` to the exact production frontend domain.
3. Multi-worker rate limiting: provision Redis and configure `REDIS_URL` for shared sliding-window state.
4. Edge CSP & TLS: verify hosted reverse proxy headers and Content Security Policy on the production edge.
5. Storage durability: verify that uploads directory points to persistent, encrypted block storage or cloud bucket.
