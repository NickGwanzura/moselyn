import { createHmac, timingSafeEqual } from 'node:crypto';
import { getPendingDonationAlerts, markDonationAlert, recordAuthorizeNetEvent } from '../../../../lib/backend-db';
import { alertEmailAddress, brandedEmailHtml, escapeHtml, sendEmail } from '../../../../lib/email';
import { getAuthorizeNetConfig } from '../../../../lib/payment-settings';

export const runtime = 'nodejs';

function validSignature(rawBody: string, header: string | null, signatureKey: string): boolean {
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
  let config;
  try { config = await getAuthorizeNetConfig(); }
  catch (error) { console.error('Could not load Authorize.Net webhook settings:', error); return Response.json({ error: 'Webhook configuration is unavailable.' }, { status: 503 }); }
  if (!validSignature(rawBody, request.headers.get('x-anet-signature'), config.signatureKey)) {
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
    for (const donation of await getPendingDonationAlerts()) {
      try {
        const amount = Number(donation.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const occurredAt = new Date(donation.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' });
        const isConfirmed = donation.status === 'completed';
        const title = isConfirmed ? 'Donation confirmed' : `Donation ${donation.status}`;
        await sendEmail({
          to: alertEmailAddress(),
          subject: `${title}: ${amount}`,
          text: `${isConfirmed ? 'Authorize.Net confirmed' : `Authorize.Net marked as ${donation.status}`} a donation of ${amount}.\nReference: ${donation.reference}\nTransaction: ${donation.transactionId ?? 'Not provided'}\nCheckout created: ${occurredAt} UTC`,
          html: brandedEmailHtml({ title, preheader: `${isConfirmed ? 'Confirmed gift' : `Payment status: ${donation.status}`} for ${amount}.`, content: `<p>${isConfirmed ? 'Authorize.Net confirmed a donation to Finding Hope Africa.' : `Authorize.Net reported a ${escapeHtml(donation.status)} payment. Please review the transaction in your payment dashboard if follow-up is needed.`}</p><table role="presentation" cellspacing="0" cellpadding="8" style="border-collapse:collapse;background:#f7f5f0;width:100%"><tr><td><strong>Amount</strong></td><td>${escapeHtml(amount)}</td></tr><tr><td><strong>Reference</strong></td><td>${escapeHtml(donation.reference)}</td></tr><tr><td><strong>Transaction</strong></td><td>${escapeHtml(donation.transactionId ?? 'Not provided')}</td></tr><tr><td><strong>Checkout created</strong></td><td>${escapeHtml(occurredAt)} UTC</td></tr></table>`, action: { label: 'Open admin dashboard', url: `${process.env.PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://findinghopeafrica.org'}/admin` } }),
          idempotencyKey: `fha-donation-${donation.reference}-${donation.status}`,
        });
        await markDonationAlert(donation.reference);
      } catch (error) {
        await markDonationAlert(donation.reference, error instanceof Error ? error.message : 'Email delivery failed');
        console.error('Donation was confirmed but its staff email alert is pending:', error);
        return Response.json({ error: 'Donation recorded; notification delivery will be retried.' }, { status: 503 });
      }
    }
    return Response.json({ received: true, result });
  } catch (error) {
    console.error('Could not process Authorize.Net webhook:', error);
    return Response.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
