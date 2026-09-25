'use client';

import { useState } from 'react';
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react';

const programs = [
  ['Education Scholarship Fund', 'education-scholarship-fund'],
  ['Eva Marie Learning Hub & Mobile Library', 'eva-marie-learning-hub'],
  ['Coding & Robotics', 'coding-robotics'],
  ['Domboshava Education Assistance', 'domboshava-education-assistance'],
  ['Better Together: Women’s Livelihoods', 'better-together'],
  ['Healthcare Training & Access', 'healthcare-training-access'],
  ['I Am Zimbabwe Riddim: Music & Arts', 'iam-zimbabwe-riddim'],
  ['Preschool Adoption', 'preschool-adoption'],
  ['Ruwa Home', 'ruwa-home'],
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);
  return <header className="site-header">
    <a className="brand" href="/" aria-label="Finding Hope Africa home"><img className="brand-logo" src="/finding-hope-africa-logo-new.png" alt="Finding Hope Africa" /></a>
    <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X/> : <Menu/>}</button>
    <nav className={menuOpen ? 'nav open' : 'nav'} aria-label="Main navigation">
      <div className="nav-item has-menu"><a href="/about">About Us <ChevronDown size={15}/></a><div className="dropdown small"><a href="/about">Our Story</a><a href="/impact">Our Impact</a><a href="/founders">Our Founders</a></div></div>
      <div className="nav-item has-menu"><button onClick={() => setProgramsOpen(!programsOpen)} aria-expanded={programsOpen}>What We Do <ChevronDown size={15}/></button><div className={programsOpen ? 'dropdown programs visible' : 'dropdown programs'}><a href="/programs">All Programmes</a>{programs.map(([label, slug]) => <a href={`/programs#${slug}`} key={slug}>{label}</a>)}</div></div>
      <a href="/blog">Our Blog</a><a href="/contact">Contact Us</a><a className="nav-donate" href="/donate">Donate Now <ArrowUpRight size={16}/></a>
    </nav>
  </header>;
}

export function SiteFooter() {
  return <footer id="footer"><div className="footer-top"><div><a className="brand footer-brand" href="/"><img className="brand-logo footer-logo" src="/finding-hope-africa-logo-new.png" alt="Finding Hope Africa" /></a><p className="footer-tagline">Rescue. Rebuild.<br/>Reintegrate.</p></div><div className="footer-nav"><p className="eyebrow">Explore</p><a href="/about">About Us</a><a href="/programs">What We Do</a><a href="/blog">Our Blog</a><a href="/contact">Contact Us</a><a href="/donate">Donate Now</a></div><div className="footer-contact"><p className="eyebrow">Find us</p><a href="mailto:info@findinghopeafrica.org">info@findinghopeafrica.org</a><a href="tel:+16268408095">(626) 840-8095</a><p>1320 N. Granito Circle<br/>Palm Springs, CA 92262</p></div></div><div className="footer-bottom"><span>© 2026 Finding Hope Africa</span><span>Registered 501(c)(3) nonprofit · EIN 82-4311719</span><div className="socials"><a href="#footer" aria-label="Instagram">ig</a><a href="#footer" aria-label="Facebook">f</a><a href="#footer" aria-label="LinkedIn">in</a></div></div></footer>;
}
