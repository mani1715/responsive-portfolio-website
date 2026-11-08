import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Users, FileCheck, AlertTriangle, 
  Mail, ArrowUpRight, CheckCircle2, ShieldAlert, KeyRound, Terminal, MessageSquare
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
            tenant isolation, and ongoing security engineering practices.
          </p>
          <div className="studio-actions">
            <a href="#verified-controls" className="studio-button">
              Review Verified Controls <ArrowUpRight size={18} />
            </a>
            <a href="#vulnerability-reporting" className="studio-text-link">
              Report a Concern
            </a>
          </div>
          <div className="hero-footnote" style={{ marginTop: '2rem' }}>
            <span>LAST REVIEWED: 8 NOVEMBER 2026 (SOURCE & TEST HARNESS VERIFICATION)</span>
          </div>
        </div>
      </section>

      {/* Section 1: Verified Controls Grid */}
      <section className="studio-section" id="verified-controls">
        <div className="studio-section-heading">
          <div>
            <p className="studio-eyebrow">01 / ARCHITECTURE DEFENSES</p>
            <h2>Verified technical controls.<br /><em>Tested in code.</em></h2>
          </div>
          <div>
            <p>
              We do not rely on security through obscurity, third-party marketing badges, or unverified claims. 
              The controls below are implemented in backend source code and validated by automated test suites.
            </p>
          </div>
        </div>

        <div className="studio-offerings" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* Control 1 */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <KeyRound size={26} strokeWidth={1.3} />
              <span>01</span>
            </div>
            <p className="studio-eyebrow">AUTHENTICATION</p>
            <h3>Dual Token Realm Separation</h3>
            <p>
              Administrative and client sessions use isolated HMAC-SHA256 JWT signing keys and distinct token claims 
              (<code>type: 'admin'</code> vs <code>type: 'client'</code>). JWT tokens are <strong>cryptographically signed, not encrypted</strong>; 
              claims are visible client-side and verified against tampering. Client tokens cannot validate against admin routes.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Verified via regression test suite (test_jwt_realm_separation)
            </div>
          </div>

          {/* Control 2 */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <Users size={26} strokeWidth={1.3} />
              <span>02</span>
            </div>
            <p className="studio-eyebrow">AUTHORIZATION</p>
            <h3>Client Tenant Isolation</h3>
            <p>
              Client portal operations strictly scope database queries by the authenticated client ID. 
              Clients cannot enumerate, read, modify, or download projects, tasks, milestones, or chats belonging to other accounts.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Verified across multi-client isolation tests (test_client_project_isolation)
            </div>
          </div>

          {/* Control 3 */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <FileCheck size={26} strokeWidth={1.3} />
              <span>03</span>
            </div>
            <p className="studio-eyebrow">FILE STORAGE</p>
            <h3>Multi-Layer Upload Inspection</h3>
            <p>
              Uploads are validated against strict binary magic signatures and extension allowlists. 
              Active SVG scripts are rejected, storage paths are bounded against directory traversal, and private client files require active tenant authorization to download.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Verified with magic byte & path traversal tests (test_unsafe_uploads_rejected)
            </div>
          </div>

          {/* Control 4 */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <ShieldCheck size={26} strokeWidth={1.3} />
              <span>04</span>
            </div>
            <p className="studio-eyebrow">NETWORK HYGIENE</p>
            <h3>Transport Security & Rate Limiting</h3>
            <p>
              API responses enforce defensive headers (<code>X-Content-Type-Options: nosniff</code>, <code>X-Frame-Options: SAMEORIGIN</code>), 
              sliding-window rate limiting on login endpoints (5 attempts per 5 minutes), and strict CORS origin checks.
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Verified in automated security test runs (test_cors_rejects_untrusted_origin)
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Transparent Scope and Known Limitations */}
      <section className="studio-section studio-process" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div>
          <p className="studio-eyebrow">02 / HONEST ARCHITECTURE DISCLOSURE</p>
          <h2>Scope & known limitations.<br /><em>Engineering reality.</em></h2>
          <p>
            Security is an ongoing engineering discipline, not a one-time score. We do not claim this application is 
            "100% unhackable," "database-proof," or "certified." Below are the documented architectural boundaries and planned improvements.
          </p>
          <Link to="/about" className="studio-text-link">
            Learn about our development standards <ArrowUpRight size={18} />
          </Link>
        </div>

        <div className="process-list">
          <div>
            <span>01</span>
            <section>
              <h3>Client Token Persistence</h3>
              <p>
                In the current decoupled hosting architecture (Vercel CDN + Render API), tokens are stored in browser storage. 
                A staged migration toward server-partitioned HttpOnly, SameSite=Strict cookies is documented in our security roadmap.
              </p>
            </section>
          </div>

          <div>
            <span>02</span>
            <section>
              <h3>Audit Log Integrity Boundary</h3>
              <p>
                Administrative event logging uses unkeyed SHA-256 hash chaining to detect application-level tampering, deletions, 
                and reordering. It does not prevent a privileged database administrator with direct raw MongoDB access from recomputing hashes. 
                Database integrity relies on MongoDB VPC isolation and access control.
              </p>
            </section>
          </div>

          <div>
            <span>03</span>
            <section>
              <h3>Rate Limiter Concurrency</h3>
              <p>
                The default rate limiter operates in-memory on a single worker process with a local mutex. For multi-worker production clusters, 
                a centralized Redis instance (<code>REDIS_URL</code>) is supported and required to synchronize state across workers.
              </p>
            </section>
          </div>

          <div>
            <span>04</span>
            <section>
              <h3>Hosted Infrastructure Checks</h3>
              <p>
                Hosted edge Content Security Policy (CSP), TLS termination, and reverse-proxy header trust depend on Vercel and Render cloud configurations. 
                These require administrative console verification and are tracked as hosted scope.
              </p>
            </section>
          </div>

          <div>
            <span>05</span>
            <section>
              <h3>Build-Time Supply Chain Toolchain</h3>
              <p>
                Direct runtime packages are locked via <code>frontend/yarn.lock</code> and <code>backend/requirements.txt</code>. 
                Standard yarn audits report 40 advisories in legacy <code>react-scripts 5.0.1</code> build dependencies (e.g., webpack, postcss). 
                These impact the build environment if compiling untrusted source files, and are slated for migration to Vite.
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
              If you discover a security concern, please contact our engineering team directly through our intake channels.
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
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Security Reporting Channel</h3>
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.95rem' }}>
                Direct inquiries through our <Link to="/contact" style={{ color: '#d4af37', textDecoration: 'underline' }}>Studio Contact Form</Link> or GitHub Repository Security Advisory.
              </p>
            </div>
          </div>

          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem', fontStyle: 'italic' }}>
            Note: Dedicated email intake (<code>security@metechq.com</code>) is pending production domain mail-exchanger (MX) DNS configuration. Please submit security reports via the authenticated contact form above.
          </p>

          <ul style={{ color: '#d1d5db', lineHeight: 1.8, fontSize: '0.95rem', paddingLeft: '1.25rem' }}>
            <li><strong>Initial response:</strong> Within 48 business hours of receipt.</li>
            <li><strong>Triage & Remediation:</strong> Confirmed issues are prioritized by severity and patched with regression tests.</li>
            <li><strong>Safe Harbor:</strong> We will not pursue legal action against researchers acting in good faith without data destruction or service disruption.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
