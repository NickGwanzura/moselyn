import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'fha_admin_session';
const SESSION_SECONDS = 60 * 60 * 12;
const scrypt = promisify(scryptCallback);

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

export async function verifyAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  try {
    if (!safeEqual(signature, sign(payload))) return false;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: unknown; exp?: unknown };
    if (typeof session.email !== 'string' || typeof session.exp !== 'number' || session.exp <= Math.floor(Date.now() / 1000)) return false;
    const email = session.email.trim().toLowerCase();
    if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase() && Boolean(process.env.ADMIN_PASSWORD)) return true;
    const { isActiveAdmin } = await import('./backend-db');
    return isActiveAdmin(email);
  } catch {
    return false;
  }
}

export function adminEmailFromSession(token: string | undefined): string {
  try {
    const payload = token?.split('.')[0];
    const email = payload ? (JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: unknown }).email : null;
    return typeof email === 'string' ? email.trim().toLowerCase() : 'administrator';
  } catch { return 'administrator'; }
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

export async function verifyPassword(email: string, candidate: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!process.env.ADMIN_SESSION_SECRET || !candidate) return false;
  if (normalizedEmail === process.env.ADMIN_EMAIL?.trim().toLowerCase() && process.env.ADMIN_PASSWORD) {
    return safeEqual(candidate, process.env.ADMIN_PASSWORD);
  }
  const { getActiveAdminPasswordHash } = await import('./backend-db');
  const encoded = await getActiveAdminPasswordHash(normalizedEmail);
  if (!encoded) return false;
  const [salt, expected] = encoded.split(':');
  if (!salt || !expected) return false;
  const actual = await scrypt(candidate, salt, 64) as Buffer;
  return safeEqual(actual.toString('base64url'), expected);
}

export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const hash = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${hash.toString('base64url')}`;
}

export async function isConfiguredAdmin(email: string): Promise<boolean> {
  if (email.trim().toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase()) return Boolean(process.env.ADMIN_PASSWORD);
  const { isActiveAdmin } = await import('./backend-db');
  return isActiveAdmin(email.trim().toLowerCase());
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
