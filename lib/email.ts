export type OutgoingEmail = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  idempotencyKey?: string;
  replyTo?: string;
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

export function alertEmailAddress(): string {
  const address = process.env.ADMIN_ALERT_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim();
  if (!address) throw new Error('ADMIN_ALERT_EMAIL or ADMIN_EMAIL must be configured.');
  return address;
}

export function emailFromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) throw new Error('RESEND_FROM_EMAIL must be configured to a verified sender.');
  return from;
}

export async function sendEmail(message: OutgoingEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(message.idempotencyKey ? { 'Idempotency-Key': message.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: emailFromAddress(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend email request failed with HTTP ${response.status}${detail ? `: ${detail.slice(0, 500)}` : ''}`);
  }
}

export function publicSiteUrl(): string {
  return (process.env.PUBLIC_SITE_URL?.trim() || 'https://findinghopeafrica.org').replace(/\/$/, '');
}
