import { notFound } from 'next/navigation';
import { AdminPostForm } from '../../../../components/admin-post-form';
import { AdminShell } from '../../../../components/admin-shell';
import { requireAdmin } from '../../../../lib/admin-auth';
import { getAdminBlogPost } from '../../../../lib/backend-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit story | Finding Hope Africa', robots: { index: false, follow: false } };
type PageProps = { params: Promise<{ id: string }> };

export default async function EditAdminBlogPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const post = await getAdminBlogPost(id);
  if (!post) notFound();
  return <AdminShell active="blog"><div className="admin-heading"><div><p className="eyebrow">Content</p><h1>Edit story</h1><p>Changes to published stories appear on the website immediately.</p></div></div><AdminPostForm post={post}/></AdminShell>;
}
