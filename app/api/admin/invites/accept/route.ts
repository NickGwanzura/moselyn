import { createHash } from 'node:crypto';
import { acceptAdminInvite } from '../../../../../lib/backend-db';
import { createAdminSession, hashAdminPassword, getAdminCookieName, isSameOriginRequest } from '../../../../../lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin could not be verified.' }, { status: 403 });
  let body: { token?: unknown; password?: unknown };
  try { body = await request.json() as typeof body; }
  catch { return Response.json({ error: 'The invitation details are invalid.' }, { status: 400 }); }
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (token.length < 30 || token.length > 100) return Response.json({ error: 'This invitation link is invalid or expired.' }, { status: 400 });
  if (password.length < 12 || password.length > 200) return Response.json({ error: 'Choose a password between 12 and 200 characters.' }, { status: 400 });

  try {
    const passwordHash = await hashAdminPassword(password);
    const email = await acceptAdminInvite(createHash('sha256').update(token).digest('hex'), passwordHash);
    if (!email) return Response.json({ error: 'This invitation link is invalid, expired, or already used.' }, { status: 400 });
    const response = Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
    const secure = request.headers.get('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production';
    response.headers.append('set-cookie', `${getAdminCookieName()}=${createAdminSession(email)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure ? '; Secure' : ''}`);
    return response;
  } catch (error) {
    console.error('Could not accept administrator invitation:', error);
    return Response.json({ error: 'The invitation could not be completed. Please try again later.' }, { status: 503 });
  }
}
