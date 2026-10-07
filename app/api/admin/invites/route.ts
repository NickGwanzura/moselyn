import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { escapeHtml, publicSiteUrl, sendEmail } from '../../../../lib/email';
import { createAdminInvite, getActiveAdminPasswordHash, revokeAdminInvite } from '../../../../lib/backend-db';
import { getAdminCookieName, isConfiguredAdmin, isSameOriginRequest, verifyAdminSession } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin could not be verified.' }, { status: 403 });
  const jar = await cookies();
  const session = jar.get(getAdminCookieName())?.value;
  if (!(await verifyAdminSession(session))) return Response.json({ error: 'Sign in to invite an administrator.' }, { status: 401 });

  let body: { email?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return Response.json({ error: 'Enter an email address.' }, { status: 400 }); }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (await isConfiguredAdmin(email) || await getActiveAdminPasswordHash(email)) return Response.json({ error: 'That email already has administrator access.' }, { status: 409 });

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const inviter = process.env.ADMIN_EMAIL?.trim().toLowerCase() || 'Finding Hope Africa administrator';
  await createAdminInvite({ tokenHash, email, createdBy: inviter, expiresAt });
  const inviteUrl = `${publicSiteUrl()}/admin/invite/accept?token=${encodeURIComponent(token)}`;
  try {
    await sendEmail({
      to: email,
      subject: 'You are invited to Finding Hope Africa admin',
      text: `You have been invited to manage the Finding Hope Africa website. Accept your invitation within 48 hours: ${inviteUrl}`,
      html: `<p>You have been invited to manage the Finding Hope Africa website.</p><p><a href="${escapeHtml(inviteUrl)}">Accept your administrator invitation</a></p><p>This link expires in 48 hours. If you were not expecting it, you can ignore this email.</p>`,
      idempotencyKey: `admin-invite-${tokenHash}`,
    });
  } catch (error) {
    await revokeAdminInvite(tokenHash).catch((revokeError) => console.error('Could not revoke undelivered admin invitation:', revokeError));
    console.error('Could not send admin invitation email:', error);
    return Response.json({ error: 'The invitation could not be emailed. Check Resend settings and try again.' }, { status: 503 });
  }
  return Response.json({ ok: true }, { status: 201, headers: { 'cache-control': 'no-store' } });
}
