import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'fha_admin_session';
const SESSION_SECONDS = 60 * 60 * 12;

function sessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('ADMIN_SESSION_SECRET must contain at least 32 characters.');
  return secret;
}

function sign(value: string): string {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}

export function adminCookieOptions(maxAge = SESSION_SECONDS, secure = process.env.NODE_ENV === 'production') {
  return { httpOnly: true, secure, sameSite: 'strict' as const, path: '/', maxAge };
}

export function createAdminSession(email: string): string {
  const payload = Buffer.from(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  try {
    if (!safeEqual(signature, sign(payload))) return false;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: unknown; exp?: unknown };
    return typeof session.email === 'string' && session.email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
      && typeof session.exp === 'number' && session.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requireAdmin(): Promise<void> {
  if (!(await hasAdminSession())) redirect('/admin/login');
}

export async function adminPageConfig() {
  const requestHeaders = await headers();
  const secure = requestHeaders.get('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production';
  return { secure };
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const host = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ?? request.headers.get('host');
    if (!host || parsed.host.toLowerCase() !== host.toLowerCase()) return false;
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    return parsed.protocol === `${forwardedProto ?? new URL(request.url).protocol.replace(':', '')}:`;
  } catch {
    return false;
  }
}

export function verifyPassword(candidate: string): boolean {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || !process.env.ADMIN_SESSION_SECRET) return false;
  return safeEqual(candidate, password);
}

export async function checkLoginThrottle(identityHash: string): Promise<boolean> {
  const { ensureDatabase, getPool } = await import('./backend-db');
  await ensureDatabase();
  const result = await getPool().query<{ attempt_count: number; window_started_at: Date }>(
    `INSERT INTO admin_login_attempts (identity_hash, attempt_count, window_started_at) VALUES ($1, 0, NOW())
     ON CONFLICT (identity_hash) DO UPDATE SET
       attempt_count = CASE WHEN admin_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN 0 ELSE admin_login_attempts.attempt_count END,
       window_started_at = CASE WHEN admin_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE admin_login_attempts.window_started_at END
     RETURNING attempt_count, window_started_at`, [identityHash]);
  return Number(result.rows[0]?.attempt_count ?? 0) < 8;
}

export async function noteFailedLogin(identityHash: string): Promise<void> {
  const { ensureDatabase, getPool } = await import('./backend-db');
  await ensureDatabase();
  await getPool().query(
    `INSERT INTO admin_login_attempts (identity_hash, attempt_count) VALUES ($1, 1)
     ON CONFLICT (identity_hash) DO UPDATE SET
       attempt_count = CASE WHEN admin_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN 1 ELSE admin_login_attempts.attempt_count + 1 END,
       window_started_at = CASE WHEN admin_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE admin_login_attempts.window_started_at END`, [identityHash]);
}

export async function clearLoginAttempts(identityHash: string): Promise<void> {
  const { ensureDatabase, getPool } = await import('./backend-db');
  await ensureDatabase();
  await getPool().query('DELETE FROM admin_login_attempts WHERE identity_hash = $1', [identityHash]);
}

export function hashLoginIdentity(ip: string): string {
  return createHmac('sha256', sessionSecret()).update(ip).digest('hex');
}

export function emailConfigured(): string {
  return process.env.ADMIN_EMAIL ?? '';
}
