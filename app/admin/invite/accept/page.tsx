import { AcceptAdminInviteForm } from '../../../../components/admin-invite-form';
import SiteLink from '../../../../components/site-link';

export const metadata = { title: 'Accept admin invitation | Finding Hope Africa', robots: { index: false, follow: false } };

export default async function AcceptAdminInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams;
  return <main className="admin-login-page"><SiteLink className="admin-back-link" href="/">← Finding Hope Africa</SiteLink><div className="admin-login-wrap"><p className="eyebrow">Private area</p><h1>Join the FHA team</h1><p>Create your secure administrator password to accept the invitation.</p>{token.length >= 30 ? <AcceptAdminInviteForm token={token}/> : <p className="admin-error" role="alert">This invitation link is invalid or incomplete.</p>}</div></main>;
}
