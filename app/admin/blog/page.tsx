import { AdminPostDelete } from '../../../components/admin-post-delete';
import { AdminShell } from '../../../components/admin-shell';
import SiteLink from '../../../components/site-link';
import { requireAdmin } from '../../../lib/admin-auth';
import { getAdminBlogPosts, getBlogAnalytics } from '../../../lib/backend-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Manage stories | Finding Hope Africa', robots: { index: false, follow: false } };

export default async function AdminBlogPage() {
  await requireAdmin();
  const [posts, analytics] = await Promise.all([getAdminBlogPosts(), getBlogAnalytics()]);
  const viewsByPost = new Map(analytics.topPosts.map((post) => [post.id, post]));
  return <AdminShell active="blog">
    <div className="admin-heading"><div><p className="eyebrow">Content</p><h1>Stories</h1><p>Create drafts, publish updates, or edit stories already on the site.</p></div><SiteLink className="button button-dark" href="/admin/blog/new">New story</SiteLink></div>
    <section className="admin-panel admin-post-list">
      {posts.length ? posts.map((post) => { const metrics = viewsByPost.get(post.id); const scheduleLabel = post.scheduledAt ? `Scheduled for ${new Date(post.scheduledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Not visible publicly'; const visibility = post.status === 'published' ? `Published ${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''} · ${(metrics?.views ?? 0).toLocaleString('en-US')} views · ${(metrics?.last30DaysViews ?? 0).toLocaleString('en-US')} in 30 days` : post.status === 'scheduled' ? scheduleLabel : post.status === 'archived' ? 'Archived · not visible publicly' : 'Draft · not visible publicly'; return <article className="admin-post-row" key={post.id}><img src={post.image} alt=""/><div className="admin-post-summary"><span className="admin-post-category">{post.tag} · <span className={`admin-status status-${post.status}`}>{post.status}</span></span><h2>{post.title}</h2><p>{post.excerpt || post.paragraphs[0]}</p><small>{visibility}</small></div><div className="admin-post-actions"><SiteLink className="admin-secondary-button" href={`/admin/blog/${post.id}/preview`}>Preview</SiteLink><SiteLink className="admin-secondary-button" href={`/admin/blog/${post.id}`}>Edit</SiteLink><AdminPostDelete id={post.id}/></div></article>; }) : <div className="admin-empty"><strong>No stories yet</strong><p>Create your first post to get started.</p></div>}
    </section>
  </AdminShell>;
}
