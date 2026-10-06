'use client';

import { useState, type FormEvent } from 'react';

export function AdminLoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not sign in.');
      window.location.assign('/admin');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in.');
      setLoading(false);
    }
  }
  return <form className="admin-login-card" onSubmit={submit}>
    <label>Email address<input name="email" type="email" autoComplete="username" required /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <button className="button button-dark" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
  </form>;
}
