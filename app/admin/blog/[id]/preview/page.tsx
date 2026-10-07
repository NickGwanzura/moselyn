import { notFound } from 'next/navigation';
import SiteLink from '../../../../../components/site-link';
import { AdminShell } from '../../../../../components/admin-shell';
import { requireAdmin } from '../../../../../lib/admin-auth';
import { getAdminBlogPost } from '../../../../../lib/backend-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Story preview | Finding Hope Africa', robots: { index: false, follow: false } };
type PageProps = { params: Promise<{ id: string }> };

export default async function AdminBlogPreviewPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const post = await getAdminBlogPost(id);
  if (!post) notFound();
  return <AdminShell active="blog"><div className="admin-heading"><div><p className="eyebrow">Private preview · {post.status}</p><h1>Story preview</h1><p>This view is only available to signed-in administrators.</p></div><SiteLink className="admin-secondary-button" href={`/admin/blog/${post.id}`}>Edit story</SiteLink></div><article className="admin-story-preview"><header style={{ backgroundImage: `linear-gradient(90deg,#171b19d9,#171b1950),url("${post.image.replaceAll('"', '')}")` }}><span>{post.tag}</span><h2>{post.title}</h2><p>{post.excerpt}</p></header><div className="admin-story-preview-body">{post.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article></AdminShell>;
}
