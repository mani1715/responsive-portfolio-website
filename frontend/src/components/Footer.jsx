import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Github, Linkedin, Instagram } from 'lucide-react';
import { agencyInfo } from '../data/mock';
import newsletterService from '../services/newsletterService';
import settingsService from '../services/settingsService';
export default function Footer() {
  const [email,setEmail] = useState('');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState(null);
  const [social,setSocial] = useState(agencyInfo.socialLinks);
  useEffect(() => { let active = true; settingsService.getSettings().then(data => { if(active && data.social_links) setSocial(previous => ({...previous,...data.social_links})); }).catch(() => {}); return () => { active = false; }; }, []);
  const subscribe = async event => {
    event.preventDefault(); if(busy) return; setBusy(true); setMessage(null);
    try { const result = await newsletterService.subscribe(email.trim()); setMessage({type:'success',text:result.message || 'You’re subscribed. Thank you for joining us.'}); setEmail(''); }
    catch(error) { setMessage({type:'error',text:error.message || 'We couldn’t subscribe you. Please try again.'}); }
    finally { setBusy(false); }
  };
  return <footer className="studio-footer">
    <div className="studio-footer-top"><div className="studio-footer-intro"><Link to="/" className="studio-brand"><span className="brand-symbol">m<span>.</span></span><span>METECHQ<small>DESIGN & DEVELOPMENT</small></span></Link><p>Thoughtful design.<br/>Purposeful development.<br/>A better digital experience.</p><Link className="footer-conversation" to="/contact">Let’s create something together <ArrowUpRight size={18}/></Link></div>
      <nav className="studio-footer-links" aria-label="Footer navigation"><h2>Explore</h2><Link to="/about">The studio</Link><Link to="/services">Our services</Link><Link to="/portfolio">Our work</Link><Link to="/contact">Get in touch</Link><Link to="/security">Security & Privacy</Link><Link to="/client/login" data-testid="footer-client-login">Client portal <ArrowUpRight size={13}/></Link></nav>
      <div className="studio-footer-newsletter"><h2>Letters from the studio</h2><p>Occasional updates on our work, ideas, and what’s next.</p><form onSubmit={subscribe}><label htmlFor="footer-email">Your email address</label><div className="studio-newsletter-field"><input id="footer-email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} disabled={busy} onChange={e => setEmail(e.target.value)}/><button type="submit" disabled={busy} aria-label="Subscribe to newsletter">{busy ? '…' : <ArrowRight size={20}/>}</button></div>{message && <p className={`newsletter-feedback ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}<small>Only the good things. Unsubscribe anytime.</small></form></div>
    </div>
    <div className="studio-footer-bottom"><p>© {new Date().getFullYear()} METECHQ. Crafted with care.</p><div className="studio-footer-social">{[[Github,'github','GitHub'],[Linkedin,'linkedin','LinkedIn'],[Instagram,'instagram','Instagram']].map(([Icon,key,label]) => social[key] && <a key={key} href={social[key]} target="_blank" rel="noopener noreferrer" aria-label={label}><Icon size={17}/></a>)}</div><div style={{display:'inline-flex',gap:'1rem',alignItems:'center'}}><Link to="/security">Security & Privacy</Link><Link to="/admin/login" data-testid="footer-admin-login">Studio login <ArrowUpRight size={13}/></Link></div></div>
  </footer>;
}
