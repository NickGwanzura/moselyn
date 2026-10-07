import { AdminShell } from '../../components/admin-shell';
import SiteLink from '../../components/site-link';
import { requireAdmin } from '../../lib/admin-auth';
import { getDonationDashboard, getAdminBlogPosts, getRecentContactEnquiries } from '../../lib/backend-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin dashboard | Finding Hope Africa', robots: { index: false, follow: false } };

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [donations, posts, enquiries] = await Promise.all([getDonationDashboard(), getAdminBlogPosts(), getRecentContactEnquiries()]);
  return <AdminShell active="overview">
    <div className="admin-heading"><div><p className="eyebrow">FHA operations</p><h1>Dashboard</h1><p>Private view of published stories and Authorize.Net donation activity.</p></div><SiteLink className="button button-dark" href="/admin/blog/new">Write a story</SiteLink></div>
    <section className="admin-metrics" aria-label="Donation summary">
      <article><span>Confirmed donations</span><strong>{money.format(Number(donations.totalCompleted))}</strong><small>Authorize.Net confirmed</small></article>
      <article><span>Completed gifts</span><strong>{donations.completedCount}</strong><small>Confirmed transactions</small></article>
      <article><span>Awaiting confirmation</span><strong>{donations.pendingCount}</strong><small>Checkout started, webhook pending</small></article>
      <article><span>Stories</span><strong>{posts.filter((post) => post.status === 'published').length}</strong><small>{posts.filter((post) => post.status === 'draft').length} drafts</small></article>
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Authorize.Net</p><h2>Recent donations</h2></div><span className="admin-muted">Latest 100 checkout records</span></div>
      {donations.recent.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Date</th><th>Reference</th><th>Amount</th><th>Status</th><th>Transaction</th></tr></thead><tbody>{donations.recent.map((gift) => <tr key={gift.id}><td>{new Date(gift.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC</td><td className="admin-mono">{gift.reference}</td><td>{money.format(Number(gift.amount))}</td><td><span className={`admin-status status-${gift.status}`}>{gift.status}</span></td><td className="admin-mono">{gift.transactionId ?? '—'}</td></tr>)}</tbody></table></div> : <div className="admin-empty"><strong>No donation checkouts recorded yet</strong><p>When someone begins checkout, the gift will appear here. It is only counted in confirmed totals after Authorize.Net verifies payment.</p></div>}
      <p className="admin-footnote">This dashboard does not store card numbers or security codes. Authorize.Net is the payment processor and its webhook is the source of payment status.</p>
    </section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Contact inbox</p><h2>Recent enquiries</h2></div><span className="admin-muted">Latest 100 messages</span></div>
      {enquiries.length ? <div className="admin-enquiries">{enquiries.map((enquiry) => <article className="admin-enquiry" key={enquiry.id}><div className="admin-enquiry-heading"><div><h3>{enquiry.subject}</h3><a href={`mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(`Re: ${enquiry.subject}`)}`}>{enquiry.name} · {enquiry.email}</a></div><time dateTime={enquiry.createdAt}>{new Date(enquiry.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC</time></div><p>{enquiry.message}</p><small>{enquiry.alertSentAt ? 'Email alert sent' : 'Email alert pending or failed'}</small></article>)}</div> : <div className="admin-empty"><strong>No enquiries yet</strong><p>Messages sent through the contact form will appear here.</p></div>}
    </section>
  </AdminShell>;
}
