import { cookies } from 'next/headers';
import { ensureDatabase, getPool } from '../../../../lib/backend-db';
import { getAdminCookieName, verifyAdminSession } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const jar = await cookies();
  if (!(await verifyAdminSession(jar.get(getAdminCookieName())?.value))) return Response.json({ error: 'Sign in to export admin reports.' }, { status: 401 });
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if (!['donations', 'blog', 'enquiries'].includes(String(type)) || !validDate(from) || !validDate(to) || from > to || (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 > 365) {
    return Response.json({ error: 'Choose a valid date range of up to one year.' }, { status: 400 });
  }
  try {
    await ensureDatabase();
    const pool = getPool();
    let rows: Array<Record<string, unknown>>;
    let columns: string[];
    if (type === 'donations') {
      columns = ['created_at_utc', 'reference', 'amount', 'currency', 'donation_type', 'status', 'transaction_id'];
      const result = await pool.query(`SELECT created_at AT TIME ZONE 'UTC' AS created_at_utc, reference, amount::text, currency, 'one_time' AS donation_type, status, transaction_id FROM donations WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day') ORDER BY created_at DESC`, [from, to]);
      rows = result.rows;
    } else if (type === 'blog') {
      columns = ['view_date_utc', 'story_title', 'story_slug', 'views'];
      const result = await pool.query(`SELECT v.view_date::text AS view_date_utc, p.title AS story_title, p.slug AS story_slug, v.views FROM blog_post_daily_views v JOIN blog_posts p ON p.id = v.post_id WHERE p.status = 'published' AND v.view_date >= $1::date AND v.view_date <= $2::date ORDER BY v.view_date DESC, v.views DESC`, [from, to]);
      rows = result.rows;
    } else {
      columns = ['created_at_utc', 'name', 'email', 'subject', 'message', 'status', 'assigned_to', 'alert_sent'];
      const result = await pool.query(`SELECT created_at AT TIME ZONE 'UTC' AS created_at_utc, name, email, subject, message, status, assigned_to, (alert_sent_at IS NOT NULL) AS alert_sent FROM contact_enquiries WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day') ORDER BY created_at DESC`, [from, to]);
      rows = result.rows;
    }
    const csv = [columns.map(csvCell).join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\r\n');
    return new Response(`\uFEFF${csv}`, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="fha-${type}-${from}-to-${to}.csv"`, 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('Could not create admin CSV report:', error);
    return Response.json({ error: 'The report could not be created.' }, { status: 503 });
  }
}
