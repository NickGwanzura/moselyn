import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { fhaPrograms } from '../../lib/programs';
export const metadata: Metadata = { title: 'What We Do | Finding Hope Africa' };
export default function ProgramsPage(){return <main><section className="page-hero clay-hero"><p className="eyebrow light">What we do</p><h1>One family<br/>of <em>programmes.</em></h1><p>Education, shelter, healthcare, livelihoods training and the creative arts. We walk with people toward a life of purpose.</p></section><section className="program-list"><p className="eyebrow">Our programmes</p><div className="program-grid">{fhaPrograms.map((program,i)=><Link className="program-card" id={program.slug} href={`/programs/${program.slug}`} key={program.slug}><span>{String(i+1).padStart(2,'0')} · {program.category}</span><h2>{program.title}</h2><span className="program-link">Learn more <ArrowUpRight size={17}/></span></Link>)}</div><p className="program-note">For current details about a programme, please get in touch with FHA.</p></section></main>}
