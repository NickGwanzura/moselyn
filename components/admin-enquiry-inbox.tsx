'use client';

import { useMemo, useState } from 'react';
import type { ContactEnquiry } from '../lib/backend-db';
import { AdminEnquiryStatus } from './admin-enquiry-status';

export function AdminEnquiryInbox({ enquiries, admins }: { enquiries: ContactEnquiry[]; admins: string[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return enquiries.filter((item) => (status === 'all' || item.status === status)
      && (!needle || [item.name, item.email, item.subject, item.message].some((value) => value.toLowerCase().includes(needle))));
  }, [enquiries, query, status]);
  return <>
    <div className="admin-inbox-filters"><label>Search enquiries<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, subject, or message"/></label><label>Follow-up status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></label><span className="admin-muted">{filtered.length} shown</span></div>
    {filtered.length ? <div className="admin-enquiries">{filtered.map((enquiry) => <article className="admin-enquiry" key={enquiry.id}><div className="admin-enquiry-heading"><div><h3>{enquiry.subject}</h3><a href={`mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(`Re: ${enquiry.subject}`)}`}>{enquiry.name} · {enquiry.email}</a></div><div className="admin-enquiry-meta"><time dateTime={enquiry.createdAt}>{new Date(enquiry.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC</time><AdminEnquiryStatus id={enquiry.id} initialStatus={enquiry.status} initialAssignedTo={enquiry.assignedTo} admins={admins}/></div></div><p>{enquiry.message}</p><small>{enquiry.alertSentAt ? 'Email alert sent' : 'Email alert pending or failed'}</small></article>)}</div> : <div className="admin-empty"><strong>{enquiries.length ? 'No matching enquiries' : 'No enquiries yet'}</strong><p>{enquiries.length ? 'Try a different search or follow-up status.' : 'Messages sent through the contact form will appear here.'}</p></div>}
  </>;
}
