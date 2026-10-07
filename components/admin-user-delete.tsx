'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminUserDelete({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function remove() {
    if (!window.confirm(`Remove admin access for ${email}? They will no longer be able to sign in.`)) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not remove administrator.');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not remove administrator.');
      setBusy(false);
    }
  }
  return <div className="admin-user-delete"><button className="admin-delete-button" type="button" onClick={() => void remove()} disabled={busy}>{busy ? 'Removing…' : 'Remove access'}</button>{error && <small role="alert">{error}</small>}</div>;
}
