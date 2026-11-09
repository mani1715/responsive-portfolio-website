import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpRight, ArrowRight, ArrowDown, Code2, Layers, ShoppingBag, PenTool,
  ShieldCheck, Users, LayoutDashboard, Globe, Lock
} from 'lucide-react';
import api from '../services/api';
import SEO from '../components/SEO';
import ProjectImage from '../components/portfolio/ProjectImage';
import projectService from '../services/projectService';
import { getPublicTestimonials } from '../services/testimonialService';
import { trackPageView } from '../services/analytics';

const offerings = [
  [PenTool, 'Design with intention.', 'UI / UX DESIGN', 'Thoughtful interfaces that make every interaction feel natural.'],
  [Code2, 'Built to make an impact.', 'WEB DEVELOPMENT', 'Distinctive, responsive websites that turn your vision into a digital experience.'],
  [ShoppingBag, 'A better way to shop.', 'E-COMMERCE', 'Seamless storefronts, from the first discovery to the final checkout.'],
  [Layers, 'Ideas without limits.', 'FULL-STACK DEVELOPMENT', 'Connected applications with a strong foundation and room to grow.']
];

export default function Home() {
  const [content, setContent] = useState(null);
  const [projects, setProjects] = useState(() => {
    try {
      const cached = projectService.getCachedProjects();
      if (Array.isArray(cached) && cached.length > 0) {
        return cached.slice(0, 3);
      }
    } catch (e) {}
    return [];
  });
  const [projectState, setProjectState] = useState(() => {
    try {
      const cached = projectService.getCachedProjects();
      if (Array.isArray(cached) && cached.length > 0) return 'ready';
    } catch (e) {}
    return 'loading';
  });
  const [attempt, setAttempt] = useState(0);
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    let active = true;
    trackPageView('home');
    api.get('/content/').then(r => { if(active) setContent(r.data); }).catch(() => {});
    projectService.getPublicProjects().then(data => {
      if(active && Array.isArray(data) && data.length > 0) {
        setProjects(data.slice(0, 3));
        setProjectState('ready');
      }
    }).catch(() => {
      if(active && projects.length === 0) setProjectState('error');
    });
    getPublicTestimonials().then(data => { if(active) setQuotes(data.slice(0,3)); }).catch(() => {});
    return () => { active = false; };
  }, [attempt]);

  return (
    <div className="studio-home">
      <SEO 
        title="METECHQ | Design & Development Studio" 
        description="Thoughtful websites, digital platforms, and verified client workspaces." 
        canonical="https://metechq.com/"
      />

      {/* Hero Section */}
      <section className="studio-hero">
        <div className="hero-editorial">
          <p className="studio-eyebrow"><span></span> INDEPENDENT DIGITAL STUDIO</p>
          <h1 data-admin-editable="hero-headline">
            {content?.hero_headline || <>Thoughtfully<br/>designed.<br/><em>Beautifully</em> built.</>}
          </h1>
          <p className="studio-hero-copy" data-admin-editable="hero-description">
            {content?.hero_description || 'We bring ambitious ideas to life through distinctive design and purposeful development. METECHQ is a modern digital agency platform combining a public portfolio and interactive demos with an authenticated client workspace and administrative management tools.'}
          </p>
          <div className="studio-actions">
            <Link to="/contact" className="studio-button">
              {content?.hero_cta1_text || 'Start a project'}<ArrowUpRight size={18}/>
            </Link>
            <Link to="/portfolio" className="studio-text-link">
              {content?.hero_cta2_text || 'Explore our work'}<ArrowRight size={17}/>
            </Link>
          </div>
          <div className="hero-footnote">
            <span>DESIGN WITH PURPOSE. BUILD WITH CARE.</span>
            <a href="#studio-work" aria-label="Scroll to selected work"><ArrowDown size={19}/></a>
          </div>
        </div>
        <div className="studio-art" role="img" aria-label="Architectural composition of amber arches and champagne planes in warm sunlight">
          <div className="art-grid"/><span className="art-caption">FORM MEETS FUNCTION</span><div className="art-sun"/><div className="art-arch arch-back"/><div className="art-arch arch-front"/><div className="art-plinth"/><div className="art-orbit"/><span className="art-star">✳</span>
          <div className="art-label"><span>A different<br/><em>perspective.</em></span><small>CRAFTED TO STAND APART — 01</small></div>
          <span className="art-side">METECHQ / DIGITAL EXPERIENCES</span>
        </div>
      </section>

      <div className="studio-discipline">
        <span>Strategy meets creativity.</span>
        <p>WEB DESIGN <i>✳</i> DEVELOPMENT <i>✳</i> E-COMMERCE <i>✳</i> DIGITAL EXPERIENCES</p>
      </div>

      {/* Section 01: Services */}
      <section className="studio-section" id="studio-services">
        <div className="studio-section-heading">
          <div><p className="studio-eyebrow">01 / WHAT WE DO</p><h2>Good design.<br/><em>Even better experiences.</em></h2></div>
          <div><p>From the first sketch to the final line of code, we connect the details that make your business feel like you.</p><Link to="/services" className="studio-text-link">Discover our services <ArrowUpRight size={18}/></Link></div>
        </div>
        <div className="studio-offerings">
          {offerings.map(([Icon,title,label,description],i) => (
            <Link to="/services" className="studio-offering" key={label}>
              <div className="offering-top"><Icon size={25} strokeWidth={1.3}/><span>0{i+1}</span></div>
              <p className="studio-eyebrow">{label}</p>
              <h3>{title}</h3>
              <p>{description}</p>
              <ArrowUpRight className="offering-arrow" size={22}/>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 02: Selected Portfolio Experiences */}
      <section className="studio-work-section" id="studio-work">
        <div className="studio-section">
          <div className="studio-section-heading">
            <div><p className="studio-eyebrow">02 / SELECTED EXPERIENCES</p><h2>Made with care.<br/><em>Made to be remembered.</em></h2></div>
            <Link to="/portfolio" className="studio-text-link">View the portfolio <ArrowUpRight size={18}/></Link>
          </div>
          {projectState === 'loading' && <div className="work-status" role="status">Loading our latest projects…</div>}
          {projectState === 'error' && (
            <div className="work-status" role="alert">
              <h3>Our work is taking a moment to load.</h3>
              <p>Please try again to view the portfolio.</p>
              <button className="studio-button" onClick={() => setAttempt(n => n + 1)}>Try again</button>
            </div>
          )}
          {projectState === 'ready' && projects.length === 0 && <div className="work-status"><p>New work will be shared here soon.</p></div>}
          <div className="studio-work-grid">
            {projects.map(project => (
              <Link key={project.id} to={`/portfolio/${project.slug || project.id}`} className="studio-work-card">
                <div className="work-visual"><ProjectImage src={project.image_url} alt={project.title} loading="lazy"/></div>
                <div className="work-caption">
                  <div>
                    <p>{project.category}{project.live_demo_url?.startsWith('/demo/') ? ' · Demo project' : ''}</p>
                    <h3>{project.title}</h3>
                  </div>
                  <span><ArrowUpRight size={23}/></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 03: Platform Ecosystem & Workspaces */}
      <section className="studio-section" id="platform-workspaces">
        <div className="studio-section-heading">
          <div>
            <p className="studio-eyebrow">03 / THE PLATFORM AT A GLANCE</p>
            <h2>Three distinct spaces.<br/><em>One unified foundation.</em></h2>
          </div>
          <div>
            <p>
              METECHQ serves visitors, active project clients, and studio administrators through strictly segregated interfaces and data boundaries.
            </p>
          </div>
        </div>
        <div className="studio-offerings">
          {/* Visitor Journey */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <Globe size={25} strokeWidth={1.3} />
              <span>01</span>
            </div>
            <p className="studio-eyebrow">FOR VISITORS & PROSPECTS</p>
            <h3>Public Showcase & Demos</h3>
            <p>
              Explore production case studies, test live interactive demos across 8 industries (E-commerce, SaaS, LMS, Real Estate), read technical blogs, and submit project inquiries.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/portfolio" className="studio-text-link">Explore Case Studies <ArrowUpRight size={16} /></Link>
            </div>
          </div>

          {/* Client Workspace */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <Users size={25} strokeWidth={1.3} />
              <span>02</span>
            </div>
            <p className="studio-eyebrow">FOR ACTIVE CLIENTS</p>
            <h3>Client Project Workspace</h3>
            <p>
              An authenticated client workspace isolated by tenant ID. Clients track milestone deliverables, task checklists, assigned team members, budget totals, authorized file downloads, and real-time chat.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/client/login" className="studio-text-link">Client Portal Sign-In <ArrowUpRight size={16} /></Link>
            </div>
          </div>

          {/* Admin Management */}
          <div className="studio-offering" style={{ cursor: 'default' }}>
            <div className="offering-top">
              <LayoutDashboard size={25} strokeWidth={1.3} />
              <span>03</span>
            </div>
            <p className="studio-eyebrow">FOR STUDIO OPERATORS</p>
            <h3>Administrative Suite</h3>
            <p>
              Role-gated administrative suite for editorial content updates, client and project provisioning, file storage verification, and continuous integrity checks in the Security Center.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/admin/login" className="studio-text-link">Admin Sign-In <ArrowUpRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Process */}
      <section className="studio-section studio-process">
        <div>
          <p className="studio-eyebrow">04 / THE WAY WE WORK</p>
          <h2>A shared vision.<br/><em>A clear path forward.</em></h2>
          <p>Great work starts with a conversation. We keep you involved at every step, bringing clarity to the process and care to the details.</p>
          <Link to="/about" className="studio-text-link">Meet the studio <ArrowUpRight size={18}/></Link>
        </div>
        <div className="process-list">
          {[
            ['Discover','We listen, ask the right questions, and find what makes your idea unique.'],
            ['Design','We shape a visual direction and intuitive journeys around your audience.'],
            ['Develop','We turn the design into a responsive, carefully engineered experience.'],
            ['Launch & evolve','We test the details, prepare your launch, and help you take the next step.']
          ].map(([title,desc],i) => (
            <div key={title}>
              <span>0{i+1}</span>
              <section><h3>{title}</h3><p>{desc}</p></section>
              <ArrowUpRight size={20}/>
            </div>
          ))}
        </div>
      </section>
      
      {/* Section 05: Compact Security & Privacy Summary */}
      <section className="studio-section" id="security-privacy-overview" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div className="studio-section-heading">
          <div>
            <p className="studio-eyebrow">05 / DATA INTEGRITY & PRIVACY</p>
            <h2>Security by design.<br/><em>Evidence-based trust.</em></h2>
          </div>
          <div>
            <p>
              We believe client confidentiality and software security should be factual, verified, and transparent. We never rely on unverified claims or marketing badges.
            </p>
          </div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '2.5rem',
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f4d9a0', marginBottom: '0.5rem', fontWeight: 600 }}>
                <Lock size={18} /> Separate Authentication Realms
              </div>
              <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Administrators and clients authenticate through isolated cryptographic JWT realms with distinct keys, preventing cross-role access.
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f4d9a0', marginBottom: '0.5rem', fontWeight: 600 }}>
                <Users size={18} /> Strict Client Tenant Isolation
              </div>
              <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Client project data, milestones, and deliverable downloads are strictly scoped on the server to authenticated client account holders.
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f4d9a0', marginBottom: '0.5rem', fontWeight: 600 }}>
                <ShieldCheck size={18} /> Defensive Engineering
              </div>
              <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Multi-layer upload magic byte validation, login brute-force rate limiting, and hardened HTTP transport headers protect all sessions.
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>
              All platform controls are verified by automated regression test suites and documented with honest boundary disclosures.
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/security" className="studio-button" style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}>
                View Security Disclosures <ArrowUpRight size={16} />
              </Link>
              <Link to="/contact" className="studio-text-link" style={{ fontSize: '0.875rem' }}>
                Report a Concern
              </Link>
            </div>
          </div>
        </div>
      </section>

      {quotes.length > 0 && (
        <section className="studio-section studio-testimonials">
          <p className="studio-eyebrow">IN THEIR WORDS</p>
          <h2>Good work. <em>Real connections.</em></h2>
          <div>
            {quotes.map(q => (
              <blockquote key={q.id}>
                <p>“{q.message}”</p>
                <footer>{q.name}<small>{[q.role,q.company].filter(Boolean).join(' · ')}</small></footer>
              </blockquote>
            ))}
          </div>
          <Link to="/submit-testimonial" className="studio-text-link">Share your experience <ArrowUpRight size={18}/></Link>
        </section>
      )}

      <section className="studio-invitation">
        <p className="studio-eyebrow">HAVE SOMETHING IN MIND?</p>
        <h2>{content?.cta_heading || <>Let’s make<br/><em>something matter.</em></>}</h2>
        <p>{content?.cta_description || 'A fresh idea. A new beginning. A better digital experience.'}</p>
        <Link to="/contact" className="studio-button">
          {content?.cta_button_text || 'Tell us about your project'}<ArrowUpRight size={20}/>
        </Link>
        <span className="invitation-star" aria-hidden="true">✳</span>
      </section>
    </div>
  );
}
