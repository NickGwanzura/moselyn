'use client';

import { useState, type FormEvent } from 'react';

export function ContactForm() {
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: values.get('name'), email: values.get('email'), subject: values.get('subject'), message: values.get('message'), website: values.get('website') }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'We could not send your message.');
      form.reset(); setSubmitted(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'We could not send your message.'); }
    finally { setLoading(false); }
  }
  return <form className="contact-form" onSubmit={submit}>
    <label>Your name<input name="name" autoComplete="name" maxLength={120} required /></label>
    <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
    <label>Subject<input name="subject" maxLength={160} required /></label>
    <label>How can we help?<textarea name="message" rows={6} minLength={10} maxLength={5000} required /></label>
    <label className="contact-honeypot" aria-hidden="true">Leave this field blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
    {error && <p className="checkout-error" role="alert">{error}</p>}
    {submitted && <p className="contact-success" role="status">Thank you. Your message has been received, and our team will follow up soon.</p>}
    <button className="button button-dark" disabled={loading}>{loading ? 'Sending…' : 'Send message'}</button>
  </form>;
}
