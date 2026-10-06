import { ArrowUpRight } from 'lucide-react';
import Link from '../../components/site-link';
import { getPublishedBlogPosts } from '../../lib/backend-db';
import { createPageMetadata } from '../../lib/seo';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = createPageMetadata({ title: 'Stories & Updates', description: 'Read Finding Hope Africa programme updates and stories about education, livelihoods, shelter, and community work in Zimbabwe.', path: '/blog' });
export default async function BlogPage(){const blogStories=await getPublishedBlogPosts();return <main><section className="page-hero"><p className="eyebrow">Our blog</p><h1>Stories of<br/><em>life change.</em></h1><p>Stories and programme updates from Finding Hope Africa.</p></section><section className="stories-section blog-page"><div className="story-grid">{blogStories.map(s=><article className="story-card" key={s.id}><div className="card-image" style={{backgroundImage:`url(${s.image})`}}/><div className="card-body"><span>{s.tag}</span><h3>{s.title}</h3><Link href={`/blog/${s.slug}`}>Read story <ArrowUpRight size={15}/></Link></div></article>)}</div></section></main>}
