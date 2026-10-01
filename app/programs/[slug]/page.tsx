import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { fhaPrograms } from '../../../lib/programs';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return fhaPrograms.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = fhaPrograms.find((item) => item.slug === slug);
  return { title: program ? `${program.title} | Finding Hope Africa` : 'Programme | Finding Hope Africa' };
}

export default async function ProgramDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const program = fhaPrograms.find((item) => item.slug === slug);
  if (!program) notFound();

  return <main>
    <section className="page-hero clay-hero program-detail-hero">
      <p className="eyebrow light">What we do · {program.category}</p>
      <h1>{program.title}</h1>
      <p>{program.summary}</p>
    </section>
    <section className="program-detail-content">
      <div>
        <p className="eyebrow">About this programme</p>
        <h2>Walking alongside people toward a life of purpose.</h2>
        <p>{program.summary} Finding Hope Africa’s work is rooted in relationships and responds to needs in the communities it serves.</p>
        {program.detail && <p>{program.detail}</p>}
        <p>For current activities, eligibility, schedules, or ways to participate, please contact the FHA team.</p>
        <Link className="button button-dark" href="/contact">Ask us about this programme <ArrowUpRight size={17}/></Link>
      </div>
      <aside className="program-detail-note"><span className="eyebrow">Programme area</span><strong>{program.category}</strong><Link href="/programs"><ArrowLeft size={16}/> All programmes</Link></aside>
    </section>
  </main>;
}
