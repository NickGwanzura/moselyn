import { AdminShell } from '../../components/admin-shell';
import SiteLink from '../../components/site-link';
import { AdminExportControls } from '../../components/admin-export-controls';
import { AdminEnquiryInbox } from '../../components/admin-enquiry-inbox';
import { requireAdmin } from '../../lib/admin-auth';
import { getDonationDashboard, getAdminBlogPosts, getRecentContactEnquiries, getBlogAnalytics, getRecentAdminActivity, listAdminEmails } from '../../lib/backend-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin dashboard | Finding Hope Africa', robots: { index: false, follow: false } };

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [donations, posts, enquiries, blogAnalytics, activity, admins] = await Promise.all([getDonationDashboard(), getAdminBlogPosts(), getRecentContactEnquiries(), getBlogAnalytics(), getRecentAdminActivity(), listAdminEmails()]);
  const reportTo = new Date().toISOString().slice(0, 10);
  const reportFrom = new Date(new Date().getTime() - 29 * 86400000).toISOString().slice(0, 10);
  const maxDailyViews = Math.max(1, ...blogAnalytics.dailyViews.map((day) => day.views));
  return <AdminShell active="overview">
    <div className="admin-heading"><div><p className="eyebrow">FHA operations</p><h1>Dashboard</h1><p>Private view of published stories and Authorize.Net donation activity.</p></div><SiteLink className="button button-dark" href="/admin/blog/new">Write a story</SiteLink></div>
    <section className="admin-metrics" aria-label="Donation and content summary">
      <article><span>Confirmed donations</span><strong>{money.format(Number(donations.totalCompleted))}</strong><small>All time · Authorize.Net</small></article>
      <article><span>Donations in 30 days</span><strong>{money.format(Number(donations.completedLast30Days))}</strong><small>Confirmed gifts</small></article>
      <article><span>Completed gifts</span><strong>{donations.completedCount}</strong><small>Confirmed transactions</small></article>
      <article><span>Awaiting confirmation</span><strong>{donations.pendingCount}</strong><small>Checkout started, webhook pending</small></article>
      <article><span>Payment alerts</span><strong>{donations.attentionCount}</strong><small>Declined, failed, or held</small></article>
      <article><span>Stories</span><strong>{posts.filter((post) => post.status === 'published').length}</strong><small>{posts.filter((post) => post.status === 'draft').length} drafts · {posts.filter((post) => post.status === 'scheduled').length} scheduled</small></article>
    </section>
    <section className="admin-panel">
      <div className="admin-panel-heading"><div><p className="eyebrow">Story performance</p><h2>Blog analytics</h2></div><div className="admin-panel-actions"><AdminExportControls report="blog" fromDate={reportFrom} toDate={reportTo}/><SiteLink className="admin-secondary-button" href="/admin/blog">Manage stories</SiteLink></div></div>
      <div className="blog-analytics-summary">
        <article><span>Views in the last 30 days</span><strong>{blogAnalytics.last30DaysViews.toLocaleString('en-US')}</strong><small>Across published stories</small></article>
        <article><span>All-time views</span><strong>{blogAnalytics.totalViews.toLocaleString('en-US')}</strong><small>Since view tracking began</small></article>
      </div>
      <div className="blog-analytics-grid">
        <div className="blog-analytics-chart">
          <div className="blog-analytics-subheading"><h3>Daily views</h3><span>Last 7 days</span></div>
          <div className="blog-views-chart" role="img" aria-label={`Daily blog views for the last seven days: ${blogAnalytics.dailyViews.map((day) => `${new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })} ${day.views}`).join(', ')}`}>
            {blogAnalytics.dailyViews.map((day) => {
              const height = day.views ? Math.max(6, (day.views / maxDailyViews) * 100) : 0;
              return <div className="blog-views-day" key={day.date} title={`${day.views} views`}><div className="blog-views-bar-track"><span className="blog-views-bar" style={{ height: `${height}%` }}/></div><strong>{day.views}</strong><small>{new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}</small></div>;
            })}
          </div>
        </div>
        <div className="blog-analytics-top-posts">
          <div className="blog-analytics-subheading"><h3>Top stories</h3><span>By last 30 days</span></div>
          {blogAnalytics.topPosts.length ? <ol>{blogAnalytics.topPosts.slice(0, 5).map((post) => <li key={post.id}><SiteLink href={`/admin/blog/${post.id}`}>{post.title}</SiteLink><span><strong>{post.last30DaysViews.toLocaleString('en-US')}</strong><small>30 days · {post.views.toLocaleString('en-US')} all time</small></span></li>)}</ol> : <div className="admin-empty"><strong>No published stories yet</strong><p>Views will appear here after visitors read a story.</p></div>}
        </div>
      </div>
      <p className="admin-footnote">Approximate page views, not unique visitors. We store daily totals only, without visitor IDs or analytics cookies. Tracking starts with this deployment.</p>
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Authorize.Net</p><h2>Recent donations</h2></div><div className="admin-panel-actions"><AdminExportControls report="donations" fromDate={reportFrom} toDate={reportTo}/><span className="admin-muted">Latest 100 checkout records</span></div></div>
      {donations.recent.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Date</th><th>Reference</th><th>Amount</th><th>Status</th><th>Transaction</th></tr></thead><tbody>{donations.recent.map((gift) => <tr key={gift.id}><td>{new Date(gift.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC</td><td className="admin-mono">{gift.reference}</td><td>{money.format(Number(gift.amount))}</td><td><span className={`admin-status status-${gift.status}`}>{gift.status}</span></td><td className="admin-mono">{gift.transactionId ?? '—'}</td></tr>)}</tbody></table></div> : <div className="admin-empty"><strong>No donation checkouts recorded yet</strong><p>When someone begins checkout, the gift will appear here. It is only counted in confirmed totals after Authorize.Net verifies payment.</p></div>}
      <p className="admin-footnote">All gifts are one-time payments at present. This dashboard does not store card numbers or security codes. Authorize.Net is the payment processor and its webhook is the source of payment status.</p>
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Contact inbox</p><h2>Recent enquiries</h2></div><div className="admin-panel-actions"><AdminExportControls report="enquiries" fromDate={reportFrom} toDate={reportTo}/><span className="admin-muted">Latest 100 messages</span></div></div>
      <AdminEnquiryInbox enquiries={enquiries} admins={admins}/>
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Accountability</p><h2>Recent admin activity</h2></div><span className="admin-muted">Latest 25 actions</span></div>{activity.length ? <div className="admin-activity-list">{activity.map((entry, index) => <article key={`${entry.createdAt}-${index}`}><span className="admin-status">{entry.action}</span><strong>{entry.summary}</strong><small>{entry.actor} · {new Date(entry.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC</small></article>)}</div> : <div className="admin-empty"><strong>No activity recorded yet</strong><p>Story and enquiry updates will be listed here.</p></div>}</section>
  </AdminShell>;
}
