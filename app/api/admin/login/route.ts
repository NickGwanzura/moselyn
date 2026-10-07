import { createAdminSession, clearLoginAttempts, getAdminCookieName, hashLoginIdentity, checkLoginThrottle, isSameOriginRequest, noteFailedLogin, verifyPassword } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin could not be verified.' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  let identityHash: string;
  try {
    identityHash = hashLoginIdentity(ip);
    if (!(await checkLoginThrottle(identityHash))) return Response.json({ error: 'Too many attempts. Wait 15 minutes before trying again.' }, { status: 429 });
  } catch (error) {
    console.error('Admin login rate limit could not be checked:', error);
    return Response.json({ error: 'Admin sign-in is not configured.' }, { status: 503 });
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return Response.json({ error: 'Enter your email and password.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  let validCredentials = false;
  try { validCredentials = Boolean(email && password && await verifyPassword(email, password)); }
  catch (error) {
    console.error('Admin credentials could not be checked:', error);
    return Response.json({ error: 'Admin sign-in is not configured.' }, { status: 503 });
  }
  if (!validCredentials) {
    await noteFailedLogin(identityHash);
    return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }
  await clearLoginAttempts(identityHash);
  const secure = request.headers.get('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production';
  const response = Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
  response.headers.append('set-cookie', `${getAdminCookieName()}=${createAdminSession(email)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure ? '; Secure' : ''}`);
  return response;
}
