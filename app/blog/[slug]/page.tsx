import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Link from '../../../components/site-link';
import { notFound } from 'next/navigation';
import { blogStories } from '../../../lib/blog-stories';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogStories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = blogStories.find((item) => item.slug === slug);
  return { title: story ? `${story.title} | Finding Hope Africa` : 'Story | Finding Hope Africa' };
}

export default async function BlogStoryPage({ params }: PageProps) {
  const { slug } = await params;
  const story = blogStories.find((item) => item.slug === slug);
  if (!story) notFound();

  return <main>
    <section className="blog-story-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(36,26,20,.86),rgba(36,26,20,.18)),url(${story.image})` }}>
      <p className="eyebrow light">{story.tag} · FHA update</p>
      <h1>{story.title}</h1>
      <p>Programme information shared by Finding Hope Africa.</p>
    </section>
    <article className="blog-story-content">
      <Link className="text-link blog-back-link" href="/blog"><ArrowLeft size={16}/> All stories</Link>
      {story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      <a className="button button-dark" href={`/programs/${story.programSlug}`}>Explore this programme <ArrowUpRight size={17}/></a>
      <p className="blog-source-note">This is an FHA programme update, not an individual testimony. Contact FHA for the latest information.</p>
    </article>
  </main>;
}
