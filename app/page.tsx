'use client';
import { ArrowUpRight, BookOpen, CalendarDays, Code2, GraduationCap, HeartHandshake, Play, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { blogStories } from '../lib/blog-stories';
const impactStats = [
  { value: '1,000+', label: 'Students supported with books, food, and school fees', icon: BookOpen },
  { value: '200+', label: 'Women engaged in livelihoods training', icon: HeartHandshake },
  { value: '131', label: 'Students currently on the Education Scholarship Fund', icon: GraduationCap },
  { value: '491', label: 'Youth reached through coding and robotics', icon: Code2 },
  { value: '491+', label: 'Beneficiaries across FHA education programmes', icon: UsersRound },
  { value: '10+', label: 'Years of continuous operation since founding', icon: CalendarDays },
];
export default function Home(){
 return <main>
  <section id="top" className="hero"><div className="hero-image"/><div className="hero-overlay"/><div className="hero-content"><p className="eyebrow light">Zimbabwe · Since 2015</p><h1 className="script-heading">Rescue.<br/><em>Rebuild.</em><br/>Reintegrate.</h1><p className="hero-copy">We walk with Zimbabwe’s orphaned, poor and vulnerable children and families until each one finds hope and a purpose.</p><a className="button button-primary" href="#impact">Our Impact <ArrowUpRight size={17}/></a></div><div className="hero-note">One life at a time <span>↓</span></div></section>
  <section id="impact" className="impact-band"><div className="impact-heading"><div className="impact-intro"><p className="eyebrow light">Our impact</p><h2 className="script-heading">Finding Hope<br/><span>Together</span></h2></div><a className="button button-light" href="/impact">Our Impact <ArrowUpRight size={17}/></a></div><div className="stats">{impactStats.map(({value,label,icon:Icon})=><div className="stat-card" key={value}><div className="stat-card-heading"><Icon aria-hidden="true" size={19} strokeWidth={1.8}/><strong>{value}</strong></div><span>{label}</span></div>)}</div></section>
  <section className="video-section"><div className="section-label"><span className="eyebrow">See hope in motion</span><span className="line"/></div><div className="video-placeholder" role="img" aria-label="Finding Hope Africa video preview placeholder"><img className="video-image" src="https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1800&q=85" alt="" loading="lazy"/><div className="video-tint"/><span className="play-button" aria-hidden="true"><Play fill="currentColor" size={24}/></span><span className="video-caption">A glimpse into Finding Hope Africa</span></div></section>
  <section id="story" className="story-section"><div className="story-photo"/><div className="story-copy"><p className="eyebrow">Our story</p><h2 className="script-heading">Hope is a place<br/>we build <em>together.</em></h2><p>Finding Hope Africa began in 2015 when Tatenda and Jerry Johnson opened their home in Harare to ten boys living on the streets. That one act of rescue has grown into a family of programmes in education, shelter, healthcare, livelihoods training and the creative arts, walking with Zimbabwe’s most vulnerable children, youth and mothers from crisis to a life of purpose.</p><a className="button button-dark" href="/about">Read more <ArrowUpRight size={17}/></a></div></section>
  <section id="stories" className="stories-section"><div className="section-heading"><div><p className="eyebrow">Stories from FHA</p><h2 className="script-heading">Stories of <em>life change.</em></h2></div><Link className="text-link" href="/blog">Read all stories <ArrowUpRight size={17}/></Link></div><div className="story-grid story-carousel" aria-label="Stories from Finding Hope Africa">{blogStories.map(s=><article className="story-card" key={s.title}><div className="card-image" style={{backgroundImage:`url(${s.image})`}}/><div className="card-body"><span>{s.tag}</span><h3>{s.title}</h3><Link href={`/blog/${s.slug}`}>Read story <ArrowUpRight size={15}/></Link></div></article>)}</div></section>
  <section id="donate" className="donate-cta"><div><p className="eyebrow light">Get involved</p><h2>There is room<br/>for you <em>here.</em></h2></div><a className="button button-light" href="/donate">Give today <ArrowUpRight size={17}/></a></section>
 </main>;
}
