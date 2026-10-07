'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function AdminInviteForm() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setError(''); setLoading(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch('/api/admin/invites', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: form.get('email') }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not send the invitation.');
      formElement.reset(); setMessage('Invitation sent. It expires in 48 hours.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not send the invitation.'); }
    finally { setLoading(false); }
  }
  return <form className="admin-post-form admin-invite-form" onSubmit={submit}>
    <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {message && <p className="admin-success" role="status">{message}</p>}
    <div className="admin-form-actions"><button className="button button-dark" disabled={loading}>{loading ? 'Sending…' : 'Send invitation'}</button></div>
  </form>;
}

export function AcceptAdminInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    const password = new FormData(event.currentTarget).get('password');
    try {
      const response = await fetch('/api/admin/invites/accept', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not accept the invitation.');
      router.push('/admin');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not accept the invitation.'); setLoading(false); }
  }
  return <form className="admin-login-card" onSubmit={submit}>
    <label>Create password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={200} required /></label>
    <small>Use at least 12 characters. This invitation can only be used once.</small>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <button className="button button-dark" disabled={loading}>{loading ? 'Setting up…' : 'Accept invitation'}</button>
  </form>;
}
