import { cookies } from 'next/headers';
import { assignContactEnquiry, isActiveAdmin, recordAdminActivity, setContactEnquiryStatus, type ContactEnquiry } from '../../../../../lib/backend-db';
import { adminEmailFromSession, getAdminCookieName, isConfiguredAdmin, isSameOriginRequest, verifyAdminSession } from '../../../../../lib/admin-auth';

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) return Response.json({ error: 'Request origin could not be verified.' }, { status: 403 });
  const jar = await cookies();
  const session = jar.get(getAdminCookieName())?.value;
  if (!(await verifyAdminSession(session))) return Response.json({ error: 'Sign in to update enquiries.' }, { status: 401 });
  let body: { status?: unknown; assignedTo?: unknown };
  try { body = await request.json() as typeof body; } catch { return Response.json({ error: 'Choose an enquiry status.' }, { status: 400 }); }
  const { id } = await context.params;
  if (body.status !== undefined) {
    if (!['new', 'in_progress', 'resolved'].includes(String(body.status))) return Response.json({ error: 'Choose a valid enquiry status.' }, { status: 400 });
    const status = body.status as ContactEnquiry['status'];
    if (!(await setContactEnquiryStatus(id, status))) return Response.json({ error: 'Enquiry not found.' }, { status: 404 });
    await recordAdminActivity(adminEmailFromSession(session), 'updated', 'enquiry', id, `Changed enquiry status to ${status.replace('_', ' ')}`).catch((error) => console.error('Could not record enquiry activity:', error));
  }
  if (Object.hasOwn(body, 'assignedTo')) {
    const assignedTo = typeof body.assignedTo === 'string' ? body.assignedTo.trim().toLowerCase() : '';
    if (assignedTo && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assignedTo) || !(await isConfiguredAdmin(assignedTo) || await isActiveAdmin(assignedTo)))) return Response.json({ error: 'Choose an active administrator.' }, { status: 400 });
    if (!(await assignContactEnquiry(id, assignedTo || null))) return Response.json({ error: 'Enquiry not found.' }, { status: 404 });
    await recordAdminActivity(adminEmailFromSession(session), 'assigned', 'enquiry', id, assignedTo ? `Assigned enquiry to ${assignedTo}` : 'Removed enquiry assignment').catch((error) => console.error('Could not record enquiry assignment:', error));
  }
  return Response.json({ ok: true }, { headers: { 'cache-control': 'no-store' } });
}
