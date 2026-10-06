import { AdminShell } from '../../../../components/admin-shell';
import { AdminPostForm } from '../../../../components/admin-post-form';
import { requireAdmin } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Write a story | Finding Hope Africa', robots: { index: false, follow: false } };

export default async function NewAdminBlogPage() {
  await requireAdmin();
  return <AdminShell active="blog"><div className="admin-heading"><div><p className="eyebrow">Content</p><h1>Write a story</h1><p>Save a draft or publish this story to the public blog.</p></div></div><AdminPostForm/></AdminShell>;
}
