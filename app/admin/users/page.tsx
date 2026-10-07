import { cookies } from 'next/headers';
import { AdminShell } from '../../../components/admin-shell';
import { AdminUserDelete } from '../../../components/admin-user-delete';
import SiteLink from '../../../components/site-link';
import { adminEmailFromSession, getAdminCookieName, requireAdmin } from '../../../lib/admin-auth';
import { listAdminUsers } from '../../../lib/backend-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin users | Finding Hope Africa', robots: { index: false, follow: false } };

export default async function AdminUsersPage() {
  await requireAdmin();
  const [users, jar] = await Promise.all([listAdminUsers(), cookies()]);
  const current = adminEmailFromSession(jar.get(getAdminCookieName())?.value);
  const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() && process.env.ADMIN_PASSWORD ? process.env.ADMIN_EMAIL.trim().toLowerCase() : undefined;
  const ownerIncluded = ownerEmail && users.some((user) => user.email.toLowerCase() === ownerEmail);
  return <AdminShell active="users">
    <div className="admin-heading"><div><p className="eyebrow">Access management</p><h1>Admin users</h1><p>Review who can access the private FHA administration area.</p></div><SiteLink className="button button-dark" href="/admin/invites">Invite an admin</SiteLink></div>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Access list</p><h2>Administrators</h2></div><span className="admin-muted">{users.length + (ownerEmail && !ownerIncluded ? 1 : 0)} account(s)</span></div>
      <div className="admin-table-wrap"><table className="admin-table admin-users-table"><thead><tr><th>Email</th><th>Access type</th><th>Added</th><th>Invited by</th><th>Action</th></tr></thead><tbody>
        {ownerEmail && !ownerIncluded && <tr><td>{ownerEmail}{ownerEmail === current && <span className="admin-muted"> · You</span>}</td><td><span className="admin-status status-completed">Environment owner</span></td><td>Configured in Dokploy</td><td>—</td><td><span className="admin-muted">Protected</span></td></tr>}
        {users.map((user) => { const isOwner = user.email.toLowerCase() === ownerEmail; const isSelf = user.email.toLowerCase() === current; return <tr key={user.email}><td>{user.email}{isSelf && <span className="admin-muted"> · You</span>}</td><td><span className={`admin-status ${isOwner ? 'status-completed' : ''}`}>{isOwner ? 'Environment owner' : 'Invited admin'}</span></td><td>{new Date(user.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'UTC' })} UTC</td><td>{user.invitedBy}</td><td>{isOwner ? <span className="admin-muted">Protected owner</span> : isSelf ? <span className="admin-muted">Current account</span> : <AdminUserDelete email={user.email}/>}</td></tr>; })}
        {!users.length && !ownerEmail && <tr><td colSpan={5} className="admin-muted">No administrator accounts found.</td></tr>}
      </tbody></table></div>
      <p className="admin-footnote">Removing access immediately prevents that account from signing in. The currently signed-in account, configured environment owner, and final administrator cannot be removed.</p>
    </section>
  </AdminShell>;
}
