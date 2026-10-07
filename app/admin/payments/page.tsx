import { AdminPaymentSettingsForm } from '../../../components/admin-payment-settings-form';
import { AdminShell } from '../../../components/admin-shell';
import { requireAdmin } from '../../../lib/admin-auth';
import { getAuthorizeNetSettingsSummary } from '../../../lib/payment-settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Payment settings | Finding Hope Africa', robots: { index: false, follow: false } };

export default async function AdminPaymentsPage() {
  await requireAdmin();
  let settings: Awaited<ReturnType<typeof getAuthorizeNetSettingsSummary>>;
  try { settings = await getAuthorizeNetSettingsSummary(); }
  catch (error) {
    console.error('Could not read payment settings status:', error);
    settings = { configured: false, signatureConfigured: false, mode: process.env.AUTHORIZE_NET_MODE === 'production' ? 'production' : 'sandbox', source: 'none' };
  }
  return <AdminShell active="payments">
    <div className="admin-heading"><div><p className="eyebrow">Payment processor</p><h1>Authorize.Net</h1><p>Configure hosted donation checkout and payment webhook verification.</p></div></div>
    <section className="admin-panel"><div className="admin-panel-heading"><div><p className="eyebrow">Merchant credentials</p><h2>Payment configuration</h2></div></div><AdminPaymentSettingsForm {...settings}/></section>
    <section className="admin-panel"><p className="eyebrow">Security note</p><p className="admin-muted">Only enter merchant API keys and the webhook Signature Key. Never enter cardholder data here. For live donations, confirm your Authorize.Net webhook points to <code>/api/webhooks/authorize-net</code> and uses the same Signature Key.</p></section>
  </AdminShell>;
}
