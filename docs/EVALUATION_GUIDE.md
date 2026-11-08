# Evaluation guide

This document provides an evidence map for evaluation against the rubric. Deployment is reserved for the final stage.

## 1. Rubric and evidence

| Area | Marks | Review evidence |
| --- | ---: | --- |
| Security | 35 | `THREATS.md`, `SECURITY_SETUP.md`; token realms, ownership checks, permission dependencies, uploads, URL validation, sanitization, cryptographic audit hash chaining, and public/admin security views |
| Threat analysis and testing | 15 | Threat register; isolated test runner (`scripts/run_evaluation_tests.py`, 103 passed tests); saved verification reports; rerun pip-audit and npm audit |
| Functionality | 15 | Public portfolio with search/filter/details/repaired deployed links; admin editing; client project workspace, milestones/tasks, files and communication |
| AI usage and prompt documentation | 15 | `PROMPTS.md`: chronologically ordered prompts without timestamps; detailed implementation choices and corrected suggestions |
| Engineering quality | 10 | Shared API/services, URL/image handling, explicit loading/error/empty states, bounded API pagination, reproducible tests (17 frontend tests passing, clean production build) |
| Documentation, deployment and demo | 10 | README, this guide, portfolio/client guide, verification reports; hosted release checks remain pending |
| Total | 100 | Assessor determines marks based on the delivered evidence |

## 2. Suggested demo (7 minutes)

1. **Public homepage and navigation**: explain mocha/champagne/amber design, footer link to **Security & Privacy (`/security`)**, and visible client portal entry.
2. **Our work & portfolio**: search/filter, open case studies (including Aishu Foods and Photography & Creative Portfolio), test live demo links (verified functional across all 8 showcase demos).
3. **Public Security & Privacy Page (`/security`)**: show the plain-language breakdown of authentication isolation, client project data boundaries, file upload controls, and responsible disclosure contact (`security@metechq.com`).
4. **Admin Security Center (`/admin/security`)**: sign in as administrator; open the Security Center showing real-time control verification statuses (`Verified`, `Needs attention`, `Not verified`), cryptographic SHA-256 audit log hash-chain verification, and architecture boundary notes.
5. **Client workspace isolation**: demonstrate that client credentials can only access their assigned project ID. Show that accessing another client's project returns 404/401.
6. **Repaired defects and security hardening**:
   - Fixed live demo navigation blocking bug in `ProjectCard.jsx`, `QuickViewModal.jsx`, and `PortfolioItemPage.jsx`.
   - Added backend-protected `/api/admins/security-overview` endpoint with automated regression tests.
   - Performed dependency audits (`npm audit` reduced by 27 vulnerabilities; `pip-audit` identified 117 advisories in 19 pinned packages).
7. **Documentation**: Open `PROMPTS.md`, `THREATS.md`, and `SECURITY_SETUP.md`; acknowledge remaining hosting/multi-worker Redis requirements.

## 3. Before the assessment

Replace demonstration project records with your actual work, verify all deployed links and images, remove unverifiable metrics/testimonials, prepare non-sensitive demonstration accounts and sample files, and run the commands in `THREATS.md`. Never put credentials in slides, git, screenshots or public documentation.

## 4. Deployment comes last

Choose host/database/storage; provision secrets outside source control; configure exact frontend/API origins and HTTPS; configure production CSP and SPA fallback; ensure uploads persist privately; configure backups and restore checks; resolve dependency findings; smoke-test authentication, client isolation, uploads/downloads, deployed links and mobile layout on staging. Only then publish. No deployment was performed in this revision.
