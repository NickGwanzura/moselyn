import { getAdminCookieName, hasAdminSession, isSameOriginRequest } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin could not be verified.' }, { status: 403 });
  if (!(await hasAdminSession())) return Response.json({ ok: true });
  const secure = request.headers.get('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production';
  const response = Response.redirect(new URL('/admin/login', request.url), 303);
  response.headers.append('set-cookie', `${getAdminCookieName()}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`);
  return response;
}
