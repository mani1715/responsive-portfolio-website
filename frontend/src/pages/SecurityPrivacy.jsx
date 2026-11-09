import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Users, FileCheck, AlertTriangle, 
  Mail, ArrowUpRight, CheckCircle2, ShieldAlert, KeyRound, Terminal, MessageSquare,
  Server, GitBranch, ExternalLink, HelpCircle
} from 'lucide-react';
import SEO from '../components/SEO';
import './pages.css';

export default function SecurityPrivacy() {
  return (
    <div className="studio-home security-page">
      <SEO 
        title="Security & Privacy - METECHQ | Verified Platform Controls"
        description="Comprehensive evidence-based security overview of METECHQ: dual authentication realms, client tenant isolation, file upload protection, and responsible disclosure."
        canonical="https://metechq.com/security"
      />

      {/* Hero Header */}
      <section className="studio-hero" style={{ minHeight: 'auto', paddingBottom: '3rem' }}>
        <div className="hero-editorial">
          <p className="studio-eyebrow">
            <span></span> ARCHITECTURE & VERIFIED DEFENSES
          </p>
          <h1>
            Security & Privacy.<br />
            <em>Evidence-based</em> trust.
          </h1>
          <p className="studio-hero-copy">
            A transparent, factual breakdown of METECHQ's data boundaries, token realm separation, 
            tenant isolation, and ongoing security engineering practices. Every statement is attributed 
            to verifiable code, automated tests, or documented operational limits.
          </p>
          <div className="studio-actions">
            <a href="#verified-controls" className="studio-button">
              Review Verified Controls <ArrowUpRight size={18} />
            </a>
            <a href="#known-boundaries" className="studio-text-link">
              Known Limitations & Boundaries
            </a>
            <a href="#vulnerability-reporting" className="studio-text-link">
              Report a Concern
            </a>
          </div>
          <div className="hero-footnote" style={{ marginTop: '2rem' }}>
            <span>EVIDENCE BASE: 121 AUTOMATED BACKEND TESTS, 17 FRONTEND TESTS, AUTHORITATIVE CI AUDIT</span>
          </div>
        </div>
      </section>

      {/* Section 1: Verified Technical Controls */}
      <section className="studio-section" id="verified-controls">
        <div className="studio-section-heading">
          <div>
            <p className="studio-eyebrow">01 / ARCHITECTURE DEFENSES</p>
            <h2>Verified technical controls.<br /><em>Tested in code.</em></h2>
          </div>
          <div>
            <p>
              We do not rely on security through obscurity, third-party marketing badges, or unverified claims. 
              Each control below is implemented in source code and validated by automated regression suites.
            </p>
          </div>
        </div>

        <div className="studio-offerings" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* Control 1: Dual Token Realm */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <KeyRound size={26} strokeWidth={1.3} />
              <span>01</span>
            </div>
            <p className="studio-eyebrow">AUTHENTICATION · VERIFIED BY AUTOMATED TEST</p>
            <h3>Dual Token Realm Separation</h3>
            <p>
              Administrative and client sessions use isolated HMAC-SHA256 JWT signing keys (<code>JWT_SECRET_KEY</code> vs <code>CLIENT_JWT_SECRET</code>) 
              and distinct claims (<code>type: 'admin'</code> vs <code>type: 'client'</code>). Client tokens cannot authenticate against admin routes.
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#a1a1aa' }}>
              <strong>Scope:</strong> Backend authentication dependencies (<code>backend/auth.py</code>).<br />
              <strong>Limitation:</strong> Tokens are stored in browser <code>localStorage</code> (accessible to JavaScript).
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Verified via regression test: <code>test_jwt_realm_separation</code>
            </div>
          </div>

          {/* Control 2: Client Tenant Isolation */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <Users size={26} strokeWidth={1.3} />
              <span>02</span>
            </div>
            <p className="studio-eyebrow">AUTHORIZATION · VERIFIED BY AUTOMATED TEST</p>
            <h3>Client Tenant Data Isolation</h3>
            <p>
              Client portal operations strictly scope database queries by the authenticated client ID. 
              Clients cannot enumerate, read, modify, or download projects, tasks, milestones, or chats belonging to other accounts.
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#a1a1aa' }}>
              <strong>Scope:</strong> All <code>/api/client/*</code> endpoints (<code>backend/routes/client_portal.py</code>).<br />
              <strong>Limitation:</strong> Applies to private client portal resources; public showcase projects are intentionally public.
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Verified via isolation tests: <code>test_client_project_isolation</code>
            </div>
          </div>

          {/* Control 3: Multi-Layer Upload Inspection */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <FileCheck size={26} strokeWidth={1.3} />
              <span>03</span>
            </div>
            <p className="studio-eyebrow">STORAGE · VERIFIED BY AUTOMATED TEST</p>
            <h3>Upload Inspection & Path Confinement</h3>
            <p>
              Uploads are validated against strict binary magic signatures and extension allowlists. 
              Active SVG scripts and events are rejected, storage paths are confined to prevent directory traversal, and private client files require tenant token authorization.
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#a1a1aa' }}>
              <strong>Scope:</strong> File upload validators (<code>backend/utils/file_security.py</code>, <code>backend/utils/upload_validator.py</code>).<br />
              <strong>Limitation:</strong> Operates on local filesystem; persistent multi-instance clustering requires external object storage.
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Verified via upload tests: <code>test_unsafe_uploads_rejected</code>
            </div>
          </div>

          {/* Control 4: Brute-Force Rate Limiting */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <ShieldCheck size={26} strokeWidth={1.3} />
              <span>04</span>
            </div>
            <p className="studio-eyebrow">DEFENSE IN DEPTH · VERIFIED BY AUTOMATED TEST</p>
            <h3>Login Brute-Force Rate Limiting</h3>
            <p>
              Login endpoints enforce sliding-window rate limiting (5 attempts per 5-minute window per IP). 
              The engine supports distributed Redis synchronization and falls back gracefully to in-memory tracking with process locks if Redis is offline.
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#a1a1aa' }}>
              <strong>Scope:</strong> Admin and client login routes (<code>backend/utils/rate_limiter.py</code>).<br />
              <strong>Limitation:</strong> Default in-memory mode is process-local; multi-worker production clusters require <code>REDIS_URL</code>.
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Verified via concurrency tests: <code>test_rate_limiter_simultaneous_concurrency</code>
            </div>
          </div>

          {/* Control 5: Audit Log Integrity */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <Terminal size={26} strokeWidth={1.3} />
              <span>05</span>
            </div>
            <p className="studio-eyebrow">ACCOUNTABILITY · VERIFIED BY AUTOMATED TEST</p>
            <h3>Cryptographic Audit Log Hash Chaining</h3>
            <p>
              Administrative actions append to an audit log where each entry contains an unkeyed SHA-256 hash linking to the prior record. 
              The verifier detects records that have been modified, inserted, deleted, or reordered mid-chain.
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#a1a1aa' }}>
              <strong>Scope:</strong> Admin action logging (<code>backend/utils/audit_logger.py</code>).<br />
              <strong>Limitation:</strong> Unkeyed SHA-256 detects application-level mutations; it does not stop a privileged MongoDB administrator from recomputing the chain.
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Verified via 6 tampering tests: <code>test_audit_chain_intact_and_tampered</code>
            </div>
          </div>

          {/* Control 6: Security Headers */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <Server size={26} strokeWidth={1.3} />
              <span>06</span>
            </div>
            <p className="studio-eyebrow">NETWORK · VERIFIED AGAINST LIVE DEPLOYMENT</p>
            <h3>Transport Security & Defensive Headers</h3>
            <p>
              Enforces Strict-Transport-Security (HSTS), <code>X-Content-Type-Options: nosniff</code>, <code>X-Frame-Options: DENY</code>, 
              <code>Referrer-Policy: strict-origin-when-cross-origin</code>, <code>Permissions-Policy</code>, and a hardened Content Security Policy (CSP).
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#a1a1aa' }}>
              <strong>Scope:</strong> Vercel CDN edge (<code>frontend/vercel.json</code>) and FastAPI middleware (<code>backend/server.py</code>).<br />
              <strong>Limitation:</strong> Edge CDN caching can delay header updates until redeployment is triggered.
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Verified live via: <code>scripts/verify_hosted_headers.py</code>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Transparent Scope and Known Limitations */}
      <section className="studio-section studio-process" id="known-boundaries" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div>
          <p className="studio-eyebrow">02 / HONEST ARCHITECTURE DISCLOSURE</p>
          <h2>Scope & known limitations.<br /><em>Engineering reality.</em></h2>
          <p>
            Security is an ongoing engineering discipline, not a one-time score. We do not claim this application is 
            "100% unhackable," "database-proof," or "certified." Below are the documented architectural boundaries, 
            active trade-offs, and planned improvements.
          </p>
          <Link to="/about" className="studio-text-link">
            Learn about our development standards <ArrowUpRight size={18} />
          </Link>
        </div>

        <div className="process-list">
          <div>
            <span>01</span>
            <section>
              <h3>Client Token Storage & Browser Boundaries</h3>
              <p>
                JWT tokens are <strong>cryptographically signed with HMAC-SHA256, not encrypted</strong>. 
                In the current decoupled hosting architecture (Vercel CDN + Render API), tokens are stored in browser <code>localStorage</code> 
                and are accessible to client-side JavaScript. While our strict Content Security Policy (CSP) restricts unauthorized external script sources, 
                CSP does not eliminate all XSS risk or make localStorage equivalent to HttpOnly cookies. 
                A phased migration toward server-partitioned HttpOnly, SameSite=Strict cookies is documented in our security roadmap.
              </p>
            </section>
          </div>

          <div>
            <span>02</span>
            <section>
              <h3>Audit Log Integrity Boundary</h3>
              <p>
                Administrative event logging uses unkeyed SHA-256 hash chaining to detect application-level mutations, deletions, 
                and sequence gaps. Because the hashing is unkeyed and stored in the primary database, it does <strong>not</strong> prevent 
                a privileged database administrator with direct raw MongoDB write access from recomputing the entire hash chain from scratch. 
                Database integrity relies on MongoDB VPC isolation, role-based database credentials, and access control. 
                Additionally, lock synchronization during audit appends is process-local.
              </p>
            </section>
          </div>

          <div>
            <span>03</span>
            <section>
              <h3>Rate Limiter Multi-Worker Concurrency</h3>
              <p>
                By default, the rate limiter tracks sliding-window request timestamps in-memory on a single worker process with a local mutex. 
                If the backend is scaled across multiple Uvicorn workers or container replicas without Redis, each worker tracks its own counters. 
                For distributed rate limiting, an active Redis instance must be configured via the <code>REDIS_URL</code> environment variable.
              </p>
            </section>
          </div>

          <div>
            <span>04</span>
            <section>
              <h3>Supply Chain & Dependency Findings (Runtime vs. Build Tooling)</h3>
              <p>
                Dependency management strictly separates runtime code from developer tools:
              </p>
              <ul style={{ color: '#d1d5db', lineHeight: 1.8, fontSize: '0.9rem', marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
                <li>
                  <strong>Backend Runtime (<code>backend/requirements.txt</code>):</strong> 96 advisories across 16 pinned packages reported by <code>pip-audit</code>. 
                  Critical libraries (<code>cryptography</code>, <code>urllib3</code>, <code>certifi</code>, <code>python-multipart</code>, <code>PyJWT</code>) have been updated; 
                  remaining advisories require planned major framework migrations (e.g., Starlette, PyMongo) that will be conducted in staging. Dev tools (<code>black</code>, <code>pytest</code>) are isolated to <code>requirements-dev.txt</code>.
                </li>
                <li>
                  <strong>Frontend Toolchain (<code>frontend/yarn.lock</code>):</strong> 40 advisories (8 Low, 23 Moderate, 9 High, 0 Critical) reported by <code>yarn audit --groups dependencies</code>. 
                  All 9 High findings reside in Create React App (<code>react-scripts 5.0.1</code>) build toolchain loaders (e.g., webpack, postcss). 
                  These affect the build machine during compilation and are not bundled into or reachable at runtime in browser client bundles. Migration to Vite is scheduled to eliminate legacy CRA dependencies.
                </li>
              </ul>
            </section>
          </div>

          <div>
            <span>05</span>
            <section>
              <h3>Hosted Infrastructure & Edge Verification</h3>
              <p>
                Hosted edge Content Security Policy (CSP), TLS termination, and reverse-proxy header trust depend on cloud provider configurations 
                (Vercel and Render). We run <code>scripts/verify_hosted_headers.py</code> against live endpoints to confirm header compliance directly. 
                Hosted verification requires real-time live execution rather than assumptions based solely on repository configuration files.
              </p>
            </section>
          </div>
        </div>
      </section>

      {/* Section 3: Responsible Vulnerability Disclosure */}
      <section className="studio-section" id="vulnerability-reporting" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="studio-section-heading">
          <div>
            <p className="studio-eyebrow">03 / RESPONSIBLE DISCLOSURE</p>
            <h2>Report a vulnerability.<br /><em>Coordinated response.</em></h2>
          </div>
          <div>
            <p>
              We welcome security researchers and users who practice coordinated, responsible disclosure. 
              If you discover a security concern, please contact our engineering team directly through our active intake channels.
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '2.5rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <MessageSquare className="text-amber-400" size={32} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Active Security Reporting Channels</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#a1a1aa', fontSize: '0.95rem' }}>
                Submit reports directly through our <Link to="/contact" style={{ color: '#d4af37', textDecoration: 'underline' }}>Studio Contact Form</Link> or via GitHub Repository Security Advisory.
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ color: '#fbbf24', fontSize: '0.85rem', margin: 0 }}>
              <strong>Notice:</strong> Dedicated email intake (<code>security@metechq.com</code>) is pending production domain mail-exchanger (MX) DNS configuration. Please submit security inquiries through the contact form or GitHub advisory.
            </p>
          </div>

          <ul style={{ color: '#d1d5db', lineHeight: 1.8, fontSize: '0.95rem', paddingLeft: '1.25rem' }}>
            <li><strong>Initial response:</strong> Within 48 business hours of receipt.</li>
            <li><strong>Triage & Remediation:</strong> Confirmed issues are prioritized by severity and patched with regression tests.</li>
            <li><strong>Safe Harbor:</strong> We will not pursue legal action against researchers acting in good faith without data destruction or service disruption.</li>
            <li><strong>Prohibited Actions:</strong> Do not perform destructive attacks, spam/denial-of-service, or attempt to access or modify other users' data.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
