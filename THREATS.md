# Comprehensive Threat Model & Security Risk Register

**Scope:** Application source code, API routes, dependency graph, deployment manifests, and isolated ephemeral test harness.  
**Guiding Principle:** Factual, evidence-based threat modeling. No claims of "100% unhackable," "zero IDOR," or unconditional certifications.

---

## 1. System Architecture, Assets & Trust Boundaries

```
      [ Public Internet / Untrusted Visitors ]
                         │
                         ▼
          ┌─────────────────────────────┐
          │   Edge CDN / Proxy (Vercel) │
          │   • HTTPS / TLS 1.3         │
          │   • Strict CSP & Headers    │
          └──────────────┬──────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│ Client Browser Session  │     │ Admin Browser Session   │
│ (localStorage JWT)      │     │ (localStorage JWT)      │
│ type: 'client'          │     │ type: 'admin'           │
└────────────┬────────────┘     └────────────┬────────────┘
             │                               │
             ▼                               ▼
      /api/client/*                    /api/admins/*, /api/*
    (Client JWT Secret)              (Admin JWT Secret Key)
             │                               │
             └───────────────┬───────────────┘
                             ▼
              ┌─────────────────────────────┐
              │     FastAPI Backend Core    │
              │   • SecurityHeadersMiddleware│
              │   • CORS Origin Enforcement │
              │   • RateLimiter (Sliding)   │
              │   • Auth Dependency Realms  │
              └──────────────┬──────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌──────────────────────┐      ┌──────────────────────┐
   │ MongoDB Database     │      │ Private Local Disk   │
   │ • metechq DB         │      │ (Conscious Bounds)   │
   │ • Scoped collections │      │ • UUID file naming   │
   │ • SHA-256 audit log  │      │ • Magic byte check   │
   └──────────────────────┘      └──────────────────────┘
```

### Actors & Trust Levels
1. **Public Visitors (Untrusted):** Anonymous users browsing public showcases, blogs, and submitting contact/testimonial forms.
2. **Client Portal Users (Semi-Trusted, Tenant-Restricted):** Authenticated clients granted access strictly to their assigned `client_id` project workspace.
3. **Administrative Operators (Privileged):** Authenticated staff members with role-based permissions (`super_admin` vs granular admin flags: `canManageClients`, `canManagePortfolio`, `canManageSettings`).
4. **Database Administrator / Infrastructure Operator (High Privilege):** Direct raw access to cloud hosting, host containers, and MongoDB instances.

### Sensitive Assets & Data
- **Authentication Secrets:** `JWT_SECRET_KEY`, `CLIENT_JWT_SECRET`, database connection URI (`MONGODB_URI`), and admin password hashes (`bcrypt`).
- **Confidential Client Assets:** Project deliverables, contract milestones, budget records, team contacts, uploaded files, and internal project chat communications.
- **System Integrity Records:** Administrative audit log trail and security telemetry.
- **Client Session Tokens:** Active signed JWTs stored in browser `localStorage`.

---

## 2. API Endpoint Groups & Access Policies

| Endpoint Group | Route Prefix | Intended Actor | Enforced Authentication Policy |
| :--- | :--- | :--- | :--- |
| **Public Showcase & Content** | `/api/projects/`, `/api/content/`, `/api/blogs/`, `/api/services/` | Anyone (Public) | None required. MongoDB queries filter `is_private: false`. |
| **Inquiry & Feedback Intake** | `/api/contact/`, `/api/testimonials/submit` | Anyone (Public) | None required; Pydantic model validation, sanitized payload strings, and rate limiting. |
| **Client Authentication** | `/api/client/login` | Clients | Rate-limited (5 attempts / 5 min). Issues JWT with `type: 'client'`. |
| **Client Workspace** | `/api/client/projects/*`, `/api/client/chats/*` | Authenticated Clients | Validates `CLIENT_JWT_SECRET` and `type: 'client'`. Queries enforce `client_id == current_client['id']`. |
| **Admin Authentication** | `/api/admins/login` | Administrators | Rate-limited (5 attempts / 5 min). Issues JWT with `type: 'admin'`. |
| **Admin Management & API** | `/api/admin/*`, `/api/admins/*`, `/api/projects/all` | Authenticated Admins | Validates `JWT_SECRET_KEY` and `type: 'admin'`. Enforces granular permission flags. |
| **Super-Admin Operations** | `/api/admins/create`, `/api/admins/audit-logs` | Super Admins | Requires `current_admin['role'] == 'super_admin'`. |

---

## 3. Threat Model & Risk Register

| # | Threat Scenario | Likelihood | Impact | Mitigations & Defenses | Test Evidence & Verification Method | Residual Risk | Automation Status | Owner / Next Action |
| :-: | :--- | :-: | :-: | :--- | :--- | :--- | :--- | :--- |
| **T01** | **Broken Access Control / Cross-Tenant IDOR:** Client B queries or downloads Client A's project files, tasks, or messages | Low | High | Server-side query filtering strictly scopes queries to `current_client['id']`. File downloads check `project['client_id'] == current_client['id']`. | `test_client_project_isolation` in `client_management_test.py` (Asserts 404/401 on cross-tenant access) | Does not apply to public portfolio items, which are intended for public visibility | Automated test | Security Team / Maintain strict scoping on new routes |
| **T02** | **Token Realm Escalation:** Client token used to call privileged administrative endpoints | Low | Critical | Dual HMAC-SHA256 signing keys (`JWT_SECRET_KEY` vs `CLIENT_JWT_SECRET`) and explicit claim verification (`type: 'admin'`). | `test_jwt_realm_separation` and `test_client_token_rejected_on_admin_endpoint` in `test_comprehensive_security.py` | Tokens stored in `localStorage` are accessible to JavaScript if XSS occurs | Automated test | Security Team / Staged migration to HttpOnly cookies |
| **T03** | **Credential Stuffing & Login Brute-Force:** Automated dictionary attacks against `/api/admins/login` or `/api/client/login` | Medium | High | Sliding-window rate limiter (5 failed attempts per 5 minutes per IP). Supports distributed Redis synchronization with process-local fallback. | `test_login_rate_limiting` and `test_rate_limiter_simultaneous_concurrency` in `test_comprehensive_security.py` | Without `REDIS_URL`, fallback is process-local; multi-worker instances track separate limits | Automated test | DevOps / Configure `REDIS_URL` in production |
| **T04** | **Malicious File Upload & Path Traversal:** Uploading executable scripts, active SVG XSS, or overwriting system files via `../` | Low | High | Extension allowlist, magic-byte MIME header validation, SVG `<script>` and event inspection, UUID disk filenames, path containment checks. | `test_unsafe_uploads_rejected` and `test_upload_svg_xss_blocked` in `test_comprehensive_security.py` | Local disk storage is not shared across multi-container cloud deployments | Automated test | Dev Team / Move persistent uploads to private S3 bucket |
| **T05** | **Stored / Reflected Cross-Site Scripting (XSS):** Malicious JavaScript payloads injected into case studies, blogs, or messages | Low | High | Input validation, Pydantic schema validation, DOMPurify HTML sanitization, dangerous URL scheme rejection (`javascript:`, `data:`). | `test_project_unsafe_links_rejected` in `test_comprehensive_security.py`, `contentSecurity.test.js` | Browser `localStorage` holds JWTs; severe XSS could lead to token exfiltration | Automated test | Frontend Team / Migrate session storage to HttpOnly cookies |
| **T06** | **Supply Chain Compromise (Backend Runtime):** Exploitable vulnerabilities in third-party Python libraries | Medium | High | Pinned dependencies in `backend/requirements.txt`, separate dev requirements (`requirements-dev.txt`), automated `pip-audit` baseline checks. | `scripts/check_dependency_audits.py` and unit tests in `test_check_dependency_audits.py` | 96 advisories across 16 pinned packages require staged framework updates (Starlette, PyMongo) | CI check & Automated test | Dev Team / Staged staging migration for breaking packages |
| **T07** | **Supply Chain Compromise (Frontend Toolchain):** Vulnerabilities in Create React App build dependencies | Low | Medium | Single authoritative `frontend/yarn.lock`, CI builds with frozen lockfile (`yarn install --frozen-lockfile`), automated `yarn audit` checks. | `scripts/check_dependency_audits.py` (baseline: 40 advisories in CRA toolchain, 0 critical) | Legacy CRA build loaders affect build machine; not present in runtime browser bundles | CI check & Automated test | Frontend Team / Migrate frontend build system to Vite |
| **T08** | **Administrative Audit Log Manipulation:** Attacker or rogue admin attempts to cover tracks by altering audit records | Low | Medium | Append-only collection with unkeyed SHA-256 hash chaining linking each record to the previous hash. Verifier scans for gaps or mutations. | `test_audit_chain_intact_and_tampered` and 5 additional regression tests in `test_evaluation_security.py` | Unkeyed SHA-256 does NOT stop a privileged database administrator with direct raw MongoDB access from recomputing the chain | Automated test | Security Team / Consider external timestamp anchoring or KMS key |
| **T09** | **Clickjacking & MIME-Confusion:** App embedded in malicious iframe or browser misinterprets data types | Low | Low | Defensive HTTP headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. | `scripts/verify_hosted_headers.py` live edge check and FastAPI `SecurityHeadersMiddleware` | Edge CDN caching can delay header propagation until redeployed | Live deployment check | DevOps / Run hosted verification post-deployment |
| **T10** | **Proxy Header Abuse & IP Spoofing:** Attacker forges `X-Forwarded-For` to bypass rate limits or access controls | Low | Medium | `TRUST_PROXY` configuration controls whether upstream proxy headers are honored; IP resolution defaults to client socket if untrusted. | `test_hybrid_rate_limiter_configured_and_failure_behavior` in `test_evaluation_security.py` | Misconfiguring `TRUST_PROXY=true` behind a direct internet connection allows client IP spoofing | Automated test & Manual check | DevOps / Ensure TRUST_PROXY matches cloud network topology |
| **T11** | **Secret Leakage in Source Control:** Hardcoded API keys, database credentials, or JWT secrets committed to Git | Low | Critical | Gitleaks secret scanning configured in CI (`.gitleaks.toml`), `.env.example` placeholders, full-history scan (`fetch-depth: 0`). | `gitleaks detect --source . -c .gitleaks.toml -v` in CI pipeline | Previous commits in history must be continuously audited and allowlist kept strictly minimal | CI check | Security Team / Rotate any credential if accidentally exposed |

---

## 4. Test Environment Isolation & Safety Rules

- All automated security and CRUD tests execute against an **ephemeral, isolated test database** (`metechq_evaluation_test_*`) created by `scripts/run_evaluation_tests.py` and dropped immediately on completion.
- Temporary upload folders are created in isolated scratch directories and removed during test teardown.
- Tests use synthetic credentials (`evaluation_admin / EvaluationPass123!`).
- **Safety Directive:** Evaluators must not load-test, fuzz, or execute destructive queries against production databases or hosted endpoints.
