'use client';

import { useState } from 'react';

export function AdminEnquiryStatus({ id, initialStatus, initialAssignedTo, admins }: { id: string; initialStatus: 'new' | 'in_progress' | 'resolved'; initialAssignedTo: string | null; admins: string[] }) {
  const [status, setStatus] = useState(initialStatus);
  const [assignedTo, setAssignedTo] = useState(initialAssignedTo ?? '');
  const [error, setError] = useState('');
  async function update(nextStatus: string) {
    setError('');
    const response = await fetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
    if (!response.ok) { setError('Could not update'); return; }
    setStatus(nextStatus as typeof status);
  }
  async function assign(nextEmail: string) {
    setError('');
    const response = await fetch(`/api/admin/enquiries/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ assignedTo: nextEmail }) });
    if (!response.ok) { setError('Could not assign'); return; }
    setAssignedTo(nextEmail);
  }
  return <span className="admin-enquiry-status-control"><select aria-label="Enquiry follow-up status" value={status} onChange={(event) => void update(event.target.value)}><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select><select aria-label="Assign enquiry to an administrator" value={assignedTo} onChange={(event) => void assign(event.target.value)}><option value="">Unassigned</option>{admins.map((email) => <option value={email} key={email}>{email}</option>)}</select>{error && <small role="alert">{error}</small>}</span>;
}
