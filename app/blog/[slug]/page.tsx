import type { Metadata } from 'next';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Link from '../../../components/site-link';
import { notFound } from 'next/navigation';
import { getBlogPostBySlug, recordBlogPostView } from '../../../lib/backend-db';
import { createPageMetadata } from '../../../lib/seo';

type PageProps = { params: Promise<{ slug: string }> };

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getBlogPostBySlug(slug);
  const description = story?.paragraphs[0] ?? 'Stories and programme updates from Finding Hope Africa in Zimbabwe.';
  return createPageMetadata({
    title: story?.title ?? 'Story',
    description: description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description,
    path: `/blog/${slug}`,
    image: story?.image,
    imageAlt: story ? `${story.tag} update from Finding Hope Africa` : undefined,
    type: 'article',
  });
}

export default async function BlogStoryPage({ params }: PageProps) {
  const { slug } = await params;
  const story = await getBlogPostBySlug(slug);
  if (!story) notFound();
  try {
    await recordBlogPostView(story.id);
  } catch (error) {
    console.error('Could not record blog page view:', error);
  }

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
