'use client';

import { useState } from 'react';
import Link from './site-link';
import { ArrowUpRight, BookOpen, BriefcaseBusiness, Camera, ChevronDown, Heart, Info, Mail, MapPin, Menu, Phone, UsersRound, X } from 'lucide-react';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  return <header className="site-header">
    <Link className="brand" href="/" aria-label="Finding Hope Africa home"><img className="brand-logo" src="/finding-hope-africa-logo-new.png" alt="Finding Hope Africa" /></Link>
    <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X/> : <Menu/>}</button>
    <nav className={menuOpen ? 'nav open' : 'nav'} aria-label="Main navigation">
      <div className="nav-item has-menu"><button type="button" onClick={() => setAboutOpen(!aboutOpen)} aria-expanded={aboutOpen}>About Us <ChevronDown size={15}/></button><div className={aboutOpen ? 'dropdown small visible' : 'dropdown small'}><Link href="/about">Our Story</Link><Link href="/impact">Our Impact</Link><Link href="/founders">Our Founders</Link></div></div>
      <Link href="/blog">Our Blog</Link><Link href="/contact">Contact Us</Link><Link className="nav-admin" href="/admin">Admin</Link><Link className="nav-donate" href="/donate">Donate Now <ArrowUpRight size={16}/></Link>
    </nav>
  </header>;
}

export function SiteFooter() {
  return <footer id="footer"><div className="footer-top"><div><Link className="brand footer-brand" href="/"><img className="brand-logo footer-logo" src="/finding-hope-africa-logo-new.png" alt="Finding Hope Africa" /></Link><p className="footer-tagline">Rescue. Rebuild.<br/>Reintegrate.</p></div><div className="footer-nav"><p className="eyebrow">Explore</p><Link href="/about"><Info size={16} aria-hidden="true"/>About Us</Link><Link href="/blog"><BookOpen size={16} aria-hidden="true"/>Our Blog</Link><Link href="/contact"><Mail size={16} aria-hidden="true"/>Contact Us</Link><Link href="/donate"><Heart size={16} aria-hidden="true"/>Donate Now</Link></div><div className="footer-contact"><p className="eyebrow">Find us</p><a href="mailto:info@findinghopeafrica.org"><Mail size={16} aria-hidden="true"/>info@findinghopeafrica.org</a><a href="tel:+16268408095"><Phone size={16} aria-hidden="true"/>(626) 840-8095</a><p><MapPin size={16} aria-hidden="true"/><span>1320 N. Granito Circle<br/>Palm Springs, CA 92262</span></p></div><div className="footer-newsletter"><p className="eyebrow">Stay connected</p><div className="klaviyo-form-RBPssF"/></div></div><div className="footer-bottom"><span>© 2026 Finding Hope Africa</span><span>Finding Hope Africa is a registered 501(c)(3) nonprofit, EIN 82-4311719.</span><nav className="footer-legal" aria-label="Legal"><Link href="/cookies">Cookie Policy</Link><Link href="/terms">Terms</Link></nav><a className="developer-pill" href="https://spiritusglobal.tech" target="_blank" rel="noopener noreferrer">Built by <strong>Spiritus</strong></a><div className="socials"><a href="#footer" aria-label="Instagram"><Camera size={16}/></a><a href="#footer" aria-label="Facebook"><UsersRound size={16}/></a><a href="#footer" aria-label="LinkedIn"><BriefcaseBusiness size={16}/></a></div></div></footer>;
}
