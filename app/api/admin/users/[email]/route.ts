import { cookies } from 'next/headers';
import { deleteAdminUser, recordAdminActivity } from '../../../../../lib/backend-db';
import { adminEmailFromSession, getAdminCookieName, isSameOriginRequest, verifyAdminSession } from '../../../../../lib/admin-auth';

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ email: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin could not be verified.' }, { status: 403 });
  const jar = await cookies();
  const session = jar.get(getAdminCookieName())?.value;
  if (!(await verifyAdminSession(session))) return Response.json({ error: 'Sign in to manage administrators.' }, { status: 401 });
  const actor = adminEmailFromSession(session);
  const { email: rawEmail } = await context.params;
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: 'Invalid administrator email.' }, { status: 400 });
  if (email === actor) return Response.json({ error: 'You cannot delete your own account while signed in.' }, { status: 409 });
  if (process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) return Response.json({ error: 'The configured environment owner cannot be deleted here.' }, { status: 409 });
  try {
    const result = await deleteAdminUser(email);
    if (result === 'not_found') return Response.json({ error: 'Administrator not found.' }, { status: 404 });
    if (result === 'last_admin') return Response.json({ error: 'The last administrator account cannot be removed.' }, { status: 409 });
    await recordAdminActivity(actor, 'deleted', 'admin_user', email, `Removed administrator access for ${email}`).catch((error) => console.error('Could not record administrator removal:', error));
    return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('Could not remove administrator:', error);
    return Response.json({ error: 'Could not remove this administrator. Try again.' }, { status: 503 });
  }
}
