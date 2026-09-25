'use client';
import { ArrowUpRight, BookOpen, CalendarDays, Code2, GraduationCap, HeartHandshake, Play, UsersRound } from 'lucide-react';
const stories = [
  { title:'A place to learn, grow and belong', tag:'Education', image:'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=85' },
  { title:'Building futures with practical skills', tag:'Livelihoods', image:'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=85' },
  { title:'When a home becomes a family', tag:'Ruwa Home', image:'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=900&q=85' },
];
const impactStats = [
  { value: '1,000+', label: 'Students supported with books', icon: BookOpen },
  { value: '200+', label: 'Women engaged in livelihoods', icon: HeartHandshake },
  { value: '131', label: 'Students currently in the education programme', icon: GraduationCap },
  { value: '491', label: 'Youth reached through coding and digital skills', icon: Code2 },
  { value: '491+', label: 'Beneficiaries across FHA education programmes', icon: UsersRound },
  { value: '10+', label: 'Years of continuous operation', icon: CalendarDays },
];
export default function Home(){
 return <main>
  <section id="top" className="hero"><div className="hero-image"/><div className="hero-overlay"/><div className="hero-content"><p className="eyebrow light">Zimbabwe · Since 2015</p><h1 className="script-heading">Rescue.<br/><em>Rebuild.</em><br/>Reintegrate.</h1><p className="hero-copy">We walk with Zimbabwe’s orphaned, poor and vulnerable children and families until each one finds hope and a purpose.</p><a className="button button-light" href="#impact">Our impact <ArrowUpRight size={17}/></a></div><div className="hero-note">One life at a time <span>↓</span></div></section>
  <section id="impact" className="impact-band"><div className="impact-heading"><div className="impact-intro"><p className="eyebrow light">Our impact</p><h2 className="script-heading">Finding Hope<br/><span>Together</span></h2></div><a className="button button-light" href="/impact">Our Impact <ArrowUpRight size={17}/></a></div><div className="stats">{impactStats.map(({value,label,icon:Icon})=><div className="stat-card" key={value}><div className="stat-card-heading"><Icon aria-hidden="true" size={19} strokeWidth={1.8}/><strong>{value}</strong></div><span>{label}</span></div>)}</div></section>
  <section className="video-section"><div className="section-label"><span className="eyebrow">See hope in motion</span><span className="line"/></div><div className="video-placeholder"><div className="video-image"/><div className="video-tint"/><button className="play-button" aria-label="Play video"><Play fill="currentColor" size={24}/></button><span className="video-caption">A glimpse into Finding Hope Africa</span></div></section>
  <section id="story" className="story-section"><div className="story-photo"/><div className="story-copy"><p className="eyebrow">Our story</p><h2 className="script-heading">Hope is a place<br/>we build <em>together.</em></h2><p>Finding Hope Africa began in 2015 when Tatenda and Jerry Johnson opened their home in Harare to ten boys living on the streets. That one act of rescue has grown into a family of programmes in education, shelter, healthcare, livelihoods training and the creative arts. We walk with Zimbabwe’s most vulnerable children, youth and mothers from crisis to a life of purpose.</p><a className="button button-dark" href="/about">Read more <ArrowUpRight size={17}/></a></div></section>
  <section id="stories" className="stories-section"><div className="section-heading"><div><p className="eyebrow">From the blog</p><h2 className="script-heading">Stories of <em>life change.</em></h2></div><a className="text-link" href="/blog">Read all stories <ArrowUpRight size={17}/></a></div><div className="story-grid">{stories.map(s=><article className="story-card" key={s.title}><div className="card-image" style={{backgroundImage:`url(${s.image})`}}/><div className="card-body"><span>{s.tag}</span><h3>{s.title}</h3><a href="/blog">Read story <ArrowUpRight size={15}/></a></div></article>)}</div></section>
  <section id="donate" className="donate-cta"><div><p className="eyebrow light">Get involved</p><h2>There is room<br/>for you <em>here.</em></h2></div><a className="button button-light" href="/donate">Give today <ArrowUpRight size={17}/></a></section>
 </main>;
}
