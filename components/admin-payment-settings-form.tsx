'use client';

import { useState, type FormEvent } from 'react';

export function AdminPaymentSettingsForm({ mode, configured, signatureConfigured, source }: { mode: 'sandbox' | 'production'; configured: boolean; signatureConfigured: boolean; source: 'admin' | 'environment' | 'none' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/payment-settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiLoginId: values.get('apiLoginId'), transactionKey: values.get('transactionKey'), signatureKey: values.get('signatureKey'), mode: values.get('mode') }) });
      const result = await response.json() as { error?: string; signatureConfigured?: boolean };
      if (!response.ok) throw new Error(result.error || 'Could not save payment settings.');
      setMessage(`Settings saved securely.${result.signatureConfigured ? '' : ' Add the webhook Signature Key to enable donation status verification.'}`);
      event.currentTarget.reset();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save payment settings.'); }
    finally { setBusy(false); }
  }
  return <form className="admin-post-form admin-payment-form" onSubmit={submit}>
    <div className="admin-payment-status"><span className={`admin-status ${configured ? 'status-completed' : 'status-failed'}`}>{configured ? 'Checkout configured' : 'Checkout not configured'}</span><span className="admin-muted">Current source: {source === 'admin' ? 'Admin settings' : source === 'environment' ? 'Dokploy environment' : 'Not configured'} · Webhook signature {signatureConfigured ? 'configured' : 'missing'}</span></div>
    <div className="admin-form-grid">
      <label>API Login ID<input name="apiLoginId" autoComplete="off" placeholder={configured ? 'Saved securely · leave blank to keep' : 'Enter API Login ID'} /></label>
      <label>Transaction Key<input name="transactionKey" type="password" autoComplete="new-password" placeholder={configured ? 'Saved securely · leave blank to keep' : 'Enter Transaction Key'} /></label>
      <label className="admin-wide">Webhook Signature Key<input name="signatureKey" type="password" autoComplete="new-password" placeholder={signatureConfigured ? 'Saved securely · leave blank to keep' : 'Paste the 128-character hexadecimal key'} /><span className="admin-muted">Used to verify payment notifications from Authorize.Net. Keep it secret.</span></label>
      <label>Authorize.Net environment<select name="mode" defaultValue={mode}><option value="sandbox">Sandbox / test</option><option value="production">Production / live</option></select><span className="admin-muted">Use production only with live merchant credentials.</span></label>
    </div>
    <p className="admin-upload-note">Secrets are encrypted before being stored and are never sent back to this page. Card numbers and security codes are never stored by FHA. Changing the admin session encryption secret later will require entering these credentials again.</p>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}
    <div className="admin-form-actions"><button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : 'Save payment settings'}</button></div>
  </form>;
}
