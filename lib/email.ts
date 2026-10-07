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

export function brandedEmailHtml(input: { title: string; preheader: string; content: string; action?: { label: string; url: string } }): string {
  const siteUrl = publicSiteUrl();
  const action = input.action
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 12px"><tr><td bgcolor="#7a3b2e" style="border-radius:3px"><a href="${escapeHtml(input.action.url)}" style="display:inline-block;padding:14px 20px;color:#ffffff;text-decoration:none;font:700 13px Arial,sans-serif;letter-spacing:1px;text-transform:uppercase">${escapeHtml(input.action.label)}</a></td></tr></table>`
    : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(input.title)}</title></head><body style="margin:0;padding:0;background:#f5f4f1;color:#1d2421;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(input.preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f4f1;padding:32px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e5e1da"><tr><td style="padding:24px 32px;border-bottom:3px solid #dfaa62"><a href="${escapeHtml(siteUrl)}" style="text-decoration:none"><img src="${escapeHtml(siteUrl)}/finding-hope-africa-logo-new.png" width="168" alt="Finding Hope Africa" style="display:block;width:168px;max-width:100%;height:auto;border:0"></a></td></tr><tr><td style="padding:34px 32px 38px"><p style="margin:0 0 12px;color:#c1531f;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Finding Hope Africa</p><h1 style="margin:0 0 20px;color:#7a3b2e;font:700 30px/1.15 Georgia,serif">${escapeHtml(input.title)}</h1><div style="color:#414842;font-size:15px;line-height:1.7">${input.content}</div>${action}<p style="margin:28px 0 0;color:#747b75;font-size:12px;line-height:1.6">Finding Hope Africa · <a href="${escapeHtml(siteUrl)}" style="color:#7a3b2e">findinghopeafrica.org</a></p></td></tr><tr><td style="padding:18px 32px;background:#f7f5f0;color:#747b75;font-size:11px;line-height:1.6">Rescue, reintegrate, and build lasting hope.</td></tr></table></td></tr></table></body></html>`;
}
