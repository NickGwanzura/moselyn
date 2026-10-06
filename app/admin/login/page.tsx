import { redirect } from 'next/navigation';
import SiteLink from '../../../components/site-link';
import { hasAdminSession } from '../../../lib/admin-auth';
import { AdminLoginForm } from '../../../components/admin-login-form';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin sign in | Finding Hope Africa', robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect('/admin');
  return <main className="admin-login-page"><SiteLink className="admin-back-link" href="/">← Finding Hope Africa</SiteLink><div className="admin-login-wrap"><p className="eyebrow">Private area</p><h1>Admin sign in</h1><p>Sign in to publish stories and review donation activity.</p><AdminLoginForm/><p className="admin-login-help">Access is limited to the configured administrator account.</p></div></main>;
}
