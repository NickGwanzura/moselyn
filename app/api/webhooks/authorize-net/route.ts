import { createHmac, timingSafeEqual } from 'node:crypto';
import { recordAuthorizeNetEvent } from '../../../../lib/backend-db';

export const runtime = 'nodejs';

function validSignature(rawBody: string, header: string | null): boolean {
  const signatureKey = process.env.AUTHORIZE_NET_SIGNATURE_KEY;
  if (!signatureKey || !header) return false;
  const match = /^sha512=([0-9a-f]{128})$/i.exec(header.trim());
  if (!match) return false;
  const key = signatureKey.trim();
  if (!/^[0-9a-f]{128}$/i.test(key)) return false;
  const expected = createHmac('sha512', Buffer.from(key, 'hex')).update(rawBody, 'utf8').digest();
  const received = Buffer.from(match[1], 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

type AuthorizeNetWebhook = {
  notificationId?: string;
  webhookId?: string;
  eventType?: string;
  payload?: {
    responseCode?: number | string;
    id?: string | number;
    merchantReferenceId?: string;
    invoiceNumber?: string;
    amount?: number | string;
    authAmount?: number | string;
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get('x-anet-signature'))) {
    return Response.json({ error: 'Webhook signature is invalid.' }, { status: 401 });
  }
  let event: AuthorizeNetWebhook;
  try { event = JSON.parse(rawBody) as AuthorizeNetWebhook; }
  catch { return Response.json({ error: 'Webhook body is not valid JSON.' }, { status: 400 }); }
  if (!event.notificationId || !event.eventType || !event.payload) {
    return Response.json({ error: 'Webhook event is incomplete.' }, { status: 400 });
  }
  if (!event.eventType.startsWith('net.authorize.payment.')) return Response.json({ received: true, ignored: true });
  const reference = event.payload.merchantReferenceId ?? event.payload.invoiceNumber;
  const transactionId = String(event.payload.id ?? '');
  if (!reference || !transactionId) {
    console.warn('Signed Authorize.Net webhook had no invoice number or transaction ID.', event.webhookId);
    return Response.json({ error: 'Payment event is missing its donation reference.' }, { status: 400 });
  }
  try {
    const result = await recordAuthorizeNetEvent({
      eventId: event.notificationId,
      eventType: event.eventType,
      reference,
      transactionId,
      responseCode: String(event.payload.responseCode ?? ''),
      amount: (event.payload.authAmount ?? event.payload.amount) === undefined ? undefined : Number(event.payload.authAmount ?? event.payload.amount),
    });
    if (result === 'amount_mismatch') console.error('Authorize.Net webhook amount did not match donation record.', event.notificationId, reference);
    if (result === 'unknown') console.warn('Authorize.Net webhook referenced an unknown donation.', event.notificationId, reference);
    return Response.json({ received: true, result });
  } catch (error) {
    console.error('Could not process Authorize.Net webhook:', error);
    return Response.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
