import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import Link from '../../components/site-link';
import { blogStories } from '../../lib/blog-stories';
export const metadata: Metadata = { title: 'Our Blog | Finding Hope Africa' };
export default function BlogPage(){return <main><section className="page-hero"><p className="eyebrow">Our blog</p><h1>Stories of<br/><em>life change.</em></h1><p>Stories and programme updates from Finding Hope Africa.</p></section><section className="stories-section blog-page"><div className="story-grid">{blogStories.map(s=><article className="story-card" key={s.title}><div className="card-image" style={{backgroundImage:`url(${s.image})`}}/><div className="card-body"><span>{s.tag}</span><h3>{s.title}</h3><Link href={`/blog/${s.slug}`}>Read story <ArrowUpRight size={15}/></Link></div></article>)}</div></section></main>}
