import { AdminShell } from '../../../components/admin-shell';
import { AdminInviteForm } from '../../../components/admin-invite-form';
import { requireAdmin } from '../../../lib/admin-auth';
import { listAdminInvites } from '../../../lib/backend-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin invitations | Finding Hope Africa', robots: { index: false, follow: false } };

export default async function AdminInvitesPage() {
  await requireAdmin();
  const invites = await listAdminInvites();
  return <AdminShell active="invites">
    <div className="admin-heading"><div><p className="eyebrow">Access management</p><h1>Invite an admin</h1><p>Invite a trusted teammate to manage stories and review site activity.</p></div></div>
    <section className="admin-panel"><h2 className="admin-section-title">Send an invitation</h2><p className="admin-muted admin-intro">Invitations expire after 48 hours and can only be used once. The recipient creates their own password.</p><AdminInviteForm/></section>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Pending</p><h2>Open invitations</h2></div></div>
      {invites.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Email</th><th>Sent</th><th>Expires</th></tr></thead><tbody>{invites.map((invite) => <tr key={`${invite.email}-${invite.createdAt}`}><td>{invite.email}</td><td>{new Date(invite.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeZone: 'UTC' })} UTC</td><td>{new Date(invite.expiresAt).toLocaleString('en-US', { dateStyle: 'medium', timeZone: 'UTC' })} UTC</td></tr>)}</tbody></table></div> : <p className="admin-muted">No pending invitations.</p>}
    </section>
  </AdminShell>;
}
