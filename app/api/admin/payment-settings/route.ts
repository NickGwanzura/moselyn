import { cookies } from 'next/headers';
import { adminEmailFromSession, getAdminCookieName, isSameOriginRequest, verifyAdminSession } from '../../../../lib/admin-auth';
import { getAuthorizeNetConfig, saveAuthorizeNetConfig } from '../../../../lib/payment-settings';
import { recordAdminActivity } from '../../../../lib/backend-db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin could not be verified.' }, { status: 403 });
  const jar = await cookies();
  const session = jar.get(getAdminCookieName())?.value;
  if (!(await verifyAdminSession(session))) return Response.json({ error: 'Sign in to update payment settings.' }, { status: 401 });
  let body: { apiLoginId?: unknown; transactionKey?: unknown; signatureKey?: unknown; mode?: unknown };
  try { body = await request.json() as typeof body; } catch { return Response.json({ error: 'Check the payment settings and try again.' }, { status: 400 }); }
  const current = await getAuthorizeNetConfig().catch((error) => {
    console.error('Could not load existing Authorize.Net settings:', error);
    return null;
  });
  if (!current) return Response.json({ error: 'Payment settings are unavailable. Check the database connection.' }, { status: 503 });
  const apiLoginId = (typeof body.apiLoginId === 'string' ? body.apiLoginId.trim() : '') || current.apiLoginId;
  const transactionKey = (typeof body.transactionKey === 'string' ? body.transactionKey.trim() : '') || current.transactionKey;
  const signatureKey = (typeof body.signatureKey === 'string' ? body.signatureKey.trim() : '') || current.signatureKey;
  const mode = body.mode === 'production' ? 'production' : body.mode === 'sandbox' ? 'sandbox' : null;
  if (!apiLoginId || apiLoginId.length > 128 || !transactionKey || transactionKey.length > 128 || !mode) return Response.json({ error: 'Enter the API Login ID, Transaction Key, and environment.' }, { status: 400 });
  if (signatureKey && !/^[0-9a-f]{128}$/i.test(signatureKey)) return Response.json({ error: 'The webhook Signature Key must be 128 hexadecimal characters.' }, { status: 400 });
  try {
    await saveAuthorizeNetConfig({ apiLoginId, transactionKey, signatureKey, mode, updatedBy: adminEmailFromSession(session) });
    await recordAdminActivity(adminEmailFromSession(session), 'updated', 'payment_settings', 'authorize-net', `Updated Authorize.Net settings (${mode}).`).catch((error) => console.error('Could not record payment settings activity:', error));
    return Response.json({ ok: true, signatureConfigured: Boolean(signatureKey) }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('Could not save Authorize.Net settings:', error);
    return Response.json({ error: 'Could not save payment settings. Check the database and admin encryption secret.' }, { status: 503 });
  }
}
