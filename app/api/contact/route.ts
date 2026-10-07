import { createHmac, randomUUID } from 'node:crypto';
import { alertEmailAddress, escapeHtml, sendEmail } from '../../../lib/email';
import { checkContactRateLimit, createContactEnquiry, markContactAlert } from '../../../lib/backend-db';
import { isSameOriginRequest } from '../../../lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin could not be verified.' }, { status: 403 });
  let body: { name?: unknown; email?: unknown; subject?: unknown; message?: unknown; website?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return Response.json({ error: 'Complete the contact form and try again.' }, { status: 400 }); }
  if (typeof body.website === 'string' && body.website.trim()) return Response.json({ ok: true });
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
    || subject.length < 3 || subject.length > 160 || message.length < 10 || message.length > 5000) {
    return Response.json({ error: 'Please check your name, email, subject, and message.' }, { status: 400 });
  }
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const ipHash = createHmac('sha256', process.env.ADMIN_SESSION_SECRET || 'fha-contact-rate-limit').update(ip).digest('hex');
    if (!(await checkContactRateLimit(ipHash))) return Response.json({ error: 'You have sent several messages recently. Please try again later.' }, { status: 429 });
    const id = randomUUID();
    await createContactEnquiry({ id, name, email, subject, message, ipHash });
    try {
      await sendEmail({
        to: alertEmailAddress(),
        replyTo: email,
        subject: `New website enquiry: ${subject}`,
        text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
        html: `<h2>New website enquiry</h2><p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><div style="white-space:pre-wrap">${escapeHtml(message)}</div>`,
        idempotencyKey: `fha-enquiry-${id}`,
      });
      await markContactAlert(id);
    } catch (error) {
      await markContactAlert(id, error instanceof Error ? error.message : 'Email delivery failed').catch((dbError) => console.error('Could not record enquiry alert status:', dbError));
      console.error('Enquiry was stored but the staff email alert failed:', error);
    }
    return Response.json({ ok: true }, { status: 201, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('Could not store contact enquiry:', error);
    return Response.json({ error: 'We could not send your message right now. Please email info@findinghopeafrica.org.' }, { status: 503 });
  }
}
