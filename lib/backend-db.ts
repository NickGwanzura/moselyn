import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { blogStories, type BlogStory } from './blog-stories';

export type StoredBlogPost = Omit<BlogStory, 'status' | 'publishedAt'> & {
  id: string;
  excerpt: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DonationRecord = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'declined' | 'failed' | 'held' | 'refunded' | 'voided';
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminInvite = { email: string; expiresAt: string; createdAt: string };
export type AdminUser = { email: string; invitedBy: string; createdAt: string };
export type ContactEnquiry = { id: string; name: string; email: string; subject: string; message: string; createdAt: string; alertSentAt: string | null; status: 'new' | 'in_progress' | 'resolved'; assignedTo: string | null };
export type BlogAnalytics = {
  totalViews: number;
  last30DaysViews: number;
  dailyViews: Array<{ date: string; views: number }>;
  topPosts: Array<{ id: string; title: string; slug: string; views: number; last30DaysViews: number }>;
};

type DbRow = Record<string, unknown>;
const globalForPool = globalThis as typeof globalThis & { fhaPool?: Pool; fhaSchemaReady?: Promise<void> };

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  globalForPool.fhaPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
    ...(process.env.DATABASE_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
  });
  return globalForPool.fhaPool;
}

export async function ensureDatabase(): Promise<void> {
  if (globalForPool.fhaSchemaReady) return globalForPool.fhaSchemaReady;
  globalForPool.fhaSchemaReady = (async () => {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY,
        slug VARCHAR(120) NOT NULL UNIQUE,
        title VARCHAR(180) NOT NULL,
        tag VARCHAR(80) NOT NULL,
        excerpt VARCHAR(300) NOT NULL DEFAULT '',
        image_url TEXT NOT NULL,
        program_slug VARCHAR(120) NOT NULL DEFAULT 'education-scholarship-fund',
        body TEXT NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        published_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS blog_posts_publication_idx ON blog_posts (status, published_at DESC);
      ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
      ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_status_check CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));
      ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
      CREATE TABLE IF NOT EXISTS blog_post_daily_views (
        post_id TEXT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
        view_date DATE NOT NULL DEFAULT CURRENT_DATE,
        views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
        PRIMARY KEY (post_id, view_date)
      );
      CREATE INDEX IF NOT EXISTS blog_post_daily_views_date_idx ON blog_post_daily_views (view_date DESC);
      CREATE TABLE IF NOT EXISTS donations (
        id TEXT PRIMARY KEY,
        reference VARCHAR(20) NOT NULL UNIQUE,
        amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 1 AND amount <= 10000),
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined', 'failed', 'held', 'refunded', 'voided')),
        transaction_id VARCHAR(32) UNIQUE,
        gateway_response_code VARCHAR(8),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS donations_created_idx ON donations (created_at DESC);
      CREATE TABLE IF NOT EXISTS authorize_net_events (
        event_id VARCHAR(120) PRIMARY KEY,
        event_type VARCHAR(120) NOT NULL,
        received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS authorize_net_settings (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        api_login_id_ciphertext TEXT NOT NULL,
        transaction_key_ciphertext TEXT NOT NULL,
        signature_key_ciphertext TEXT,
        mode VARCHAR(16) NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox', 'production')),
        updated_by VARCHAR(254) NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS admin_login_attempts (
        identity_hash CHAR(64) PRIMARY KEY,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS admin_users (
        email VARCHAR(254) PRIMARY KEY,
        password_hash TEXT NOT NULL,
        invited_by VARCHAR(254) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS admin_invites (
        token_hash CHAR(64) PRIMARY KEY,
        email VARCHAR(254) NOT NULL,
        created_by VARCHAR(254) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        accepted_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS admin_invites_email_idx ON admin_invites (email, created_at DESC);
      CREATE TABLE IF NOT EXISTS contact_enquiries (
        id TEXT PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(254) NOT NULL,
        subject VARCHAR(160) NOT NULL,
        message TEXT NOT NULL,
        ip_hash CHAR(64) NOT NULL,
        alert_sent_at TIMESTAMPTZ,
        alert_error TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE contact_enquiries ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'new';
      ALTER TABLE contact_enquiries ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(254);
      ALTER TABLE contact_enquiries DROP CONSTRAINT IF EXISTS contact_enquiries_status_check;
      ALTER TABLE contact_enquiries ADD CONSTRAINT contact_enquiries_status_check CHECK (status IN ('new', 'in_progress', 'resolved'));
      CREATE TABLE IF NOT EXISTS admin_activity (
        id BIGSERIAL PRIMARY KEY,
        actor VARCHAR(254) NOT NULL,
        action VARCHAR(80) NOT NULL,
        item_type VARCHAR(40) NOT NULL,
        item_id TEXT NOT NULL,
        summary VARCHAR(300) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS admin_activity_created_idx ON admin_activity (created_at DESC);
      CREATE INDEX IF NOT EXISTS contact_enquiries_created_idx ON contact_enquiries (created_at DESC);
      CREATE TABLE IF NOT EXISTS contact_rate_limits (
        ip_hash CHAR(64) PRIMARY KEY,
        submission_count INTEGER NOT NULL DEFAULT 0,
        window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS backend_migrations (version VARCHAR(120) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS alert_sent_at TIMESTAMPTZ;
      ALTER TABLE donations ADD COLUMN IF NOT EXISTS alert_error TEXT;
    `);
    const baseline = await pool.query("INSERT INTO backend_migrations (version) VALUES ('donation-alert-baseline-v1') ON CONFLICT DO NOTHING RETURNING version");
    if (baseline.rowCount) await pool.query("UPDATE donations SET alert_sent_at = NOW() WHERE status = 'completed' AND alert_sent_at IS NULL");
    const count = await pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM blog_posts');
    if (count.rows[0]?.count === '0') {
      for (const post of blogStories) {
        await pool.query(
          `INSERT INTO blog_posts (id, slug, title, tag, excerpt, image_url, program_slug, body, status, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published', NOW()) ON CONFLICT (slug) DO NOTHING`,
          [randomUUID(), post.slug, post.title, post.tag, post.paragraphs[0]?.slice(0, 300) ?? '', post.image, post.programSlug, post.paragraphs.join('\n\n')],
        );
      }
    }
  })().catch((error) => {
    globalForPool.fhaSchemaReady = undefined;
    throw error;
  });
  return globalForPool.fhaSchemaReady;
}

function toBlogPost(row: DbRow): StoredBlogPost {
  const body = String(row.body ?? '');
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    tag: String(row.tag),
    image: String(row.image_url),
    programSlug: String(row.program_slug),
    paragraphs: body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean),
    excerpt: String(row.excerpt ?? ''),
    status: ['draft', 'scheduled', 'published', 'archived'].includes(String(row.status)) ? row.status as StoredBlogPost['status'] : 'draft',
    scheduledAt: row.scheduled_at ? new Date(String(row.scheduled_at)).toISOString() : null,
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

const BLOG_COLUMNS = 'id, slug, title, tag, excerpt, image_url, program_slug, body, status, scheduled_at, published_at, created_at, updated_at';

async function publishDuePosts(): Promise<void> {
  if (!hasDatabase()) return;
  await ensureDatabase();
  await getPool().query("UPDATE blog_posts SET status = 'published', published_at = scheduled_at, updated_at = NOW() WHERE status = 'scheduled' AND scheduled_at <= NOW()");
}

export async function getPublishedBlogPosts(): Promise<StoredBlogPost[]> {
  if (!hasDatabase()) return blogStories.map((post, index) => ({
    ...post,
    id: `seed-${index}`,
    excerpt: post.paragraphs[0] ?? '',
    status: 'published',
    scheduledAt: null,
    publishedAt: null,
    createdAt: '',
    updatedAt: '',
  }));
  await publishDuePosts();
  const result = await getPool().query(`SELECT ${BLOG_COLUMNS} FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC NULLS LAST, created_at DESC`);
  return result.rows.map(toBlogPost);
}

export async function getBlogPostBySlug(slug: string): Promise<StoredBlogPost | null> {
  if (!hasDatabase()) {
    const post = blogStories.find((story) => story.slug === slug);
    return post ? { ...post, id: `seed-${slug}`, excerpt: post.paragraphs[0] ?? '', status: 'published', scheduledAt: null, publishedAt: null, createdAt: '', updatedAt: '' } : null;
  }
  await publishDuePosts();
  const result = await getPool().query(`SELECT ${BLOG_COLUMNS} FROM blog_posts WHERE slug = $1 AND status = 'published' LIMIT 1`, [slug]);
  return result.rows[0] ? toBlogPost(result.rows[0]) : null;
}

export async function getAdminBlogPosts(): Promise<StoredBlogPost[]> {
  await ensureDatabase();
  const result = await getPool().query(`SELECT ${BLOG_COLUMNS} FROM blog_posts ORDER BY updated_at DESC`);
  return result.rows.map(toBlogPost);
}

export async function recordBlogPostView(postId: string): Promise<void> {
  if (!hasDatabase()) return;
  await ensureDatabase();
  await getPool().query(
    `INSERT INTO blog_post_daily_views (post_id, view_date, views)
     SELECT id, CURRENT_DATE, 1 FROM blog_posts WHERE id = $1 AND status = 'published'
     ON CONFLICT (post_id, view_date) DO UPDATE SET views = blog_post_daily_views.views + 1`,
    [postId],
  );
}

export async function getBlogAnalytics(): Promise<BlogAnalytics> {
  await ensureDatabase();
  const pool = getPool();
  const [summary, daily, posts] = await Promise.all([
    pool.query<{ total_views: string; last_30_days_views: string }>(
      `SELECT COALESCE(SUM(v.views), 0)::text AS total_views,
        COALESCE(SUM(v.views) FILTER (WHERE v.view_date >= CURRENT_DATE - 29), 0)::text AS last_30_days_views
       FROM blog_post_daily_views v
       JOIN blog_posts p ON p.id = v.post_id AND p.status = 'published'`,
    ),
    pool.query<{ date: string; views: string }>(
      `SELECT g.day::date::text AS date,
        COALESCE(SUM(v.views) FILTER (WHERE p.status = 'published'), 0)::text AS views
       FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, INTERVAL '1 day') AS g(day)
       LEFT JOIN blog_post_daily_views v ON v.view_date = g.day::date
       LEFT JOIN blog_posts p ON p.id = v.post_id
       GROUP BY g.day ORDER BY g.day`,
    ),
    pool.query<{ id: string; title: string; slug: string; views: string; last_30_days_views: string }>(
      `SELECT p.id, p.title, p.slug,
        COALESCE(SUM(v.views), 0)::text AS views,
        COALESCE(SUM(v.views) FILTER (WHERE v.view_date >= CURRENT_DATE - 29), 0)::text AS last_30_days_views
       FROM blog_posts p
       LEFT JOIN blog_post_daily_views v ON v.post_id = p.id
       WHERE p.status = 'published'
       GROUP BY p.id
       ORDER BY SUM(v.views) FILTER (WHERE v.view_date >= CURRENT_DATE - 29) DESC NULLS LAST, SUM(v.views) DESC NULLS LAST, p.published_at DESC NULLS LAST`,
    ),
  ]);
  return {
    totalViews: Number(summary.rows[0]?.total_views ?? 0),
    last30DaysViews: Number(summary.rows[0]?.last_30_days_views ?? 0),
    dailyViews: daily.rows.map((row) => ({ date: row.date, views: Number(row.views) })),
    topPosts: posts.rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      views: Number(row.views),
      last30DaysViews: Number(row.last_30_days_views),
    })),
  };
}

export async function getAdminBlogPost(id: string): Promise<StoredBlogPost | null> {
  await ensureDatabase();
  const result = await getPool().query(`SELECT ${BLOG_COLUMNS} FROM blog_posts WHERE id = $1 LIMIT 1`, [id]);
  return result.rows[0] ? toBlogPost(result.rows[0]) : null;
}

export async function createDonation(amount: number, reference: string): Promise<void> {
  await ensureDatabase();
  await getPool().query('INSERT INTO donations (id, reference, amount) VALUES ($1, $2, $3)', [randomUUID(), reference, amount.toFixed(2)]);
}

export async function setDonationStatus(reference: string, status: DonationRecord['status']): Promise<void> {
  await ensureDatabase();
  await getPool().query('UPDATE donations SET status = $2, updated_at = NOW() WHERE reference = $1 AND status = $3', [reference, status, 'pending']);
}

export async function createAdminInvite(input: { tokenHash: string; email: string; createdBy: string; expiresAt: Date }): Promise<void> {
  await ensureDatabase();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM admin_invites WHERE email = $1 AND accepted_at IS NULL', [input.email]);
    await client.query('INSERT INTO admin_invites (token_hash, email, created_by, expires_at) VALUES ($1, $2, $3, $4)', [input.tokenHash, input.email, input.createdBy, input.expiresAt]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

export async function revokeAdminInvite(tokenHash: string): Promise<void> {
  await ensureDatabase();
  await getPool().query('DELETE FROM admin_invites WHERE token_hash = $1 AND accepted_at IS NULL', [tokenHash]);
}

export async function acceptAdminInvite(tokenHash: string, passwordHash: string): Promise<string | null> {
  await ensureDatabase();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const invite = await client.query<{ email: string; created_by: string }>(
      'SELECT email, created_by FROM admin_invites WHERE token_hash = $1 AND accepted_at IS NULL AND expires_at > NOW() FOR UPDATE', [tokenHash]);
    if (!invite.rowCount) { await client.query('ROLLBACK'); return null; }
    const { email, created_by: createdBy } = invite.rows[0];
    await client.query('INSERT INTO admin_users (email, password_hash, invited_by) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, active = TRUE', [email, passwordHash, createdBy]);
    await client.query('UPDATE admin_invites SET accepted_at = NOW() WHERE token_hash = $1', [tokenHash]);
    await client.query('COMMIT');
    return email;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

export async function getActiveAdminPasswordHash(email: string): Promise<string | null> {
  await ensureDatabase();
  const result = await getPool().query<{ password_hash: string }>('SELECT password_hash FROM admin_users WHERE email = $1 AND active = TRUE', [email]);
  return result.rows[0]?.password_hash ?? null;
}

export async function isActiveAdmin(email: string): Promise<boolean> {
  await ensureDatabase();
  const result = await getPool().query('SELECT 1 FROM admin_users WHERE email = $1 AND active = TRUE', [email]);
  return Boolean(result.rowCount);
}

export async function listAdminInvites(): Promise<AdminInvite[]> {
  await ensureDatabase();
  const result = await getPool().query('SELECT email, expires_at, created_at FROM admin_invites WHERE accepted_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC');
  return result.rows.map((row: DbRow) => ({ email: String(row.email), expiresAt: new Date(String(row.expires_at)).toISOString(), createdAt: new Date(String(row.created_at)).toISOString() }));
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  await ensureDatabase();
  const result = await getPool().query('SELECT email, invited_by, created_at FROM admin_users WHERE active = TRUE ORDER BY created_at ASC');
  return result.rows.map((row: DbRow) => ({ email: String(row.email), invitedBy: String(row.invited_by), createdAt: new Date(String(row.created_at)).toISOString() }));
}

export async function deleteAdminUser(email: string): Promise<'deleted' | 'not_found' | 'last_admin'> {
  await ensureDatabase();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE admin_users IN EXCLUSIVE MODE');
    const found = await client.query('SELECT email FROM admin_users WHERE email = $1 AND active = TRUE FOR UPDATE', [email]);
    if (!found.rowCount) { await client.query('ROLLBACK'); return 'not_found'; }
    const count = await client.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM admin_users WHERE active = TRUE');
    const hasConfiguredOwner = Boolean(process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD);
    if (!hasConfiguredOwner && Number(count.rows[0]?.count ?? 0) <= 1) { await client.query('ROLLBACK'); return 'last_admin'; }
    await client.query('UPDATE contact_enquiries SET assigned_to = NULL WHERE assigned_to = $1', [email]);
    await client.query('DELETE FROM admin_users WHERE email = $1', [email]);
    await client.query('COMMIT');
    return 'deleted';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

export async function checkContactRateLimit(ipHash: string): Promise<boolean> {
  await ensureDatabase();
  const result = await getPool().query<{ submission_count: number }>(
    `INSERT INTO contact_rate_limits (ip_hash, submission_count, window_started_at) VALUES ($1, 1, NOW())
     ON CONFLICT (ip_hash) DO UPDATE SET
       submission_count = CASE WHEN contact_rate_limits.window_started_at < NOW() - INTERVAL '1 hour' THEN 1 ELSE contact_rate_limits.submission_count + 1 END,
       window_started_at = CASE WHEN contact_rate_limits.window_started_at < NOW() - INTERVAL '1 hour' THEN NOW() ELSE contact_rate_limits.window_started_at END
     RETURNING submission_count`, [ipHash]);
  return Number(result.rows[0]?.submission_count ?? 99) <= 5;
}

export async function createContactEnquiry(input: Omit<ContactEnquiry, 'createdAt' | 'alertSentAt' | 'status' | 'assignedTo'> & { ipHash: string }): Promise<void> {
  await ensureDatabase();
  await getPool().query('INSERT INTO contact_enquiries (id, name, email, subject, message, ip_hash) VALUES ($1, $2, $3, $4, $5, $6)', [input.id, input.name, input.email, input.subject, input.message, input.ipHash]);
}

export async function markContactAlert(id: string, error?: string): Promise<void> {
  await ensureDatabase();
  await getPool().query('UPDATE contact_enquiries SET alert_sent_at = CASE WHEN $2::text IS NULL THEN NOW() ELSE alert_sent_at END, alert_error = $2 WHERE id = $1', [id, error?.slice(0, 500) ?? null]);
}

export async function getRecentContactEnquiries(): Promise<ContactEnquiry[]> {
  await ensureDatabase();
  const result = await getPool().query('SELECT id, name, email, subject, message, created_at, alert_sent_at, status, assigned_to FROM contact_enquiries ORDER BY created_at DESC LIMIT 100');
  return result.rows.map((row: DbRow) => ({ id: String(row.id), name: String(row.name), email: String(row.email), subject: String(row.subject), message: String(row.message), createdAt: new Date(String(row.created_at)).toISOString(), alertSentAt: row.alert_sent_at ? new Date(String(row.alert_sent_at)).toISOString() : null, status: ['new', 'in_progress', 'resolved'].includes(String(row.status)) ? row.status as ContactEnquiry['status'] : 'new', assignedTo: row.assigned_to ? String(row.assigned_to) : null }));
}

export async function setContactEnquiryStatus(id: string, status: ContactEnquiry['status']): Promise<boolean> {
  await ensureDatabase();
  const result = await getPool().query('UPDATE contact_enquiries SET status = $2 WHERE id = $1', [id, status]);
  return Boolean(result.rowCount);
}

export async function assignContactEnquiry(id: string, email: string | null): Promise<boolean> {
  await ensureDatabase();
  const result = await getPool().query('UPDATE contact_enquiries SET assigned_to = $2 WHERE id = $1', [id, email]);
  return Boolean(result.rowCount);
}

export async function listAdminEmails(): Promise<string[]> {
  await ensureDatabase();
  const result = await getPool().query('SELECT email FROM admin_users WHERE active = TRUE ORDER BY email');
  const emails = result.rows.map((row: DbRow) => String(row.email));
  const configured = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (configured && !emails.includes(configured)) emails.unshift(configured);
  return emails;
}

export async function recordAdminActivity(actor: string, action: string, itemType: string, itemId: string, summary: string): Promise<void> {
  await ensureDatabase();
  await getPool().query('INSERT INTO admin_activity (actor, action, item_type, item_id, summary) VALUES ($1, $2, $3, $4, $5)', [actor.slice(0, 254), action.slice(0, 80), itemType.slice(0, 40), itemId, summary.slice(0, 300)]);
}

export async function getRecentAdminActivity(): Promise<Array<{ actor: string; action: string; itemType: string; itemId: string; summary: string; createdAt: string }>> {
  await ensureDatabase();
  const result = await getPool().query('SELECT actor, action, item_type, item_id, summary, created_at FROM admin_activity ORDER BY created_at DESC LIMIT 25');
  return result.rows.map((row: DbRow) => ({ actor: String(row.actor), action: String(row.action), itemType: String(row.item_type), itemId: String(row.item_id), summary: String(row.summary), createdAt: new Date(String(row.created_at)).toISOString() }));
}

export async function getPendingDonationAlerts(): Promise<Array<{ reference: string; amount: string; transactionId: string | null; createdAt: string; status: DonationRecord['status'] }>> {
  await ensureDatabase();
  const result = await getPool().query("SELECT reference, amount::text, transaction_id, created_at, status FROM donations WHERE status IN ('completed', 'declined', 'failed', 'held') AND alert_sent_at IS NULL ORDER BY created_at ASC LIMIT 25");
  return result.rows.map((row: DbRow) => ({ reference: String(row.reference), amount: String(row.amount), transactionId: row.transaction_id ? String(row.transaction_id) : null, createdAt: new Date(String(row.created_at)).toISOString(), status: String(row.status) as DonationRecord['status'] }));
}

export async function markDonationAlert(reference: string, error?: string): Promise<void> {
  await ensureDatabase();
  await getPool().query('UPDATE donations SET alert_sent_at = CASE WHEN $2::text IS NULL THEN NOW() ELSE alert_sent_at END, alert_error = $2 WHERE reference = $1', [reference, error?.slice(0, 500) ?? null]);
}

export async function getDonationDashboard(): Promise<{ totalCompleted: string; completedLast30Days: string; completedCount: number; pendingCount: number; attentionCount: number; recent: DonationRecord[] }> {
  await ensureDatabase();
  const pool = getPool();
  const [summary, records] = await Promise.all([
    pool.query<{ total: string; recent_total: string; completed: string; pending: string; attention: string }>(`SELECT COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)::text AS total,
      COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'), 0)::text AS recent_total,
      COUNT(*) FILTER (WHERE status = 'completed')::text AS completed,
      COUNT(*) FILTER (WHERE status = 'pending')::text AS pending,
      COUNT(*) FILTER (WHERE status IN ('declined', 'failed', 'held'))::text AS attention FROM donations`),
    pool.query(`SELECT id, reference, amount::text, currency, status, transaction_id, created_at, updated_at FROM donations ORDER BY created_at DESC LIMIT 100`),
  ]);
  return {
    totalCompleted: summary.rows[0]?.total ?? '0',
    completedLast30Days: summary.rows[0]?.recent_total ?? '0',
    completedCount: Number(summary.rows[0]?.completed ?? 0),
    pendingCount: Number(summary.rows[0]?.pending ?? 0),
    attentionCount: Number(summary.rows[0]?.attention ?? 0),
    recent: records.rows.map((row: DbRow) => ({
      id: String(row.id), reference: String(row.reference), amount: String(row.amount), currency: String(row.currency),
      status: String(row.status) as DonationRecord['status'], transactionId: row.transaction_id ? String(row.transaction_id) : null,
      createdAt: new Date(String(row.created_at)).toISOString(), updatedAt: new Date(String(row.updated_at)).toISOString(),
    })),
  };
}

export async function recordAuthorizeNetEvent(input: {
  eventId: string; eventType: string; reference: string; transactionId: string; responseCode: string; amount?: number;
}): Promise<'recorded' | 'duplicate' | 'unknown' | 'amount_mismatch'> {
  await ensureDatabase();
  const client: PoolClient = await getPool().connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT event_id FROM authorize_net_events WHERE event_id = $1', [input.eventId]);
    if (existing.rowCount) {
      await client.query('COMMIT');
      return 'duplicate';
    }
    const record = await client.query<{ amount: string; status: string }>('SELECT amount::text, status FROM donations WHERE reference = $1 FOR UPDATE', [input.reference]);
    await client.query('INSERT INTO authorize_net_events (event_id, event_type) VALUES ($1, $2)', [input.eventId, input.eventType]);
    if (!record.rowCount) {
      await client.query('COMMIT');
      return 'unknown';
    }
    if (!input.eventType.includes('.refund.') && input.amount !== undefined && Math.round(Number(record.rows[0].amount) * 100) !== Math.round(input.amount * 100)) {
      await client.query('COMMIT');
      return 'amount_mismatch';
    }
    const isCapture = input.eventType.endsWith('.authcapture.created')
      || input.eventType.endsWith('.capture.created')
      || input.eventType.endsWith('.priorAuthCapture.created');
    const eventStatus: DonationRecord['status'] | null = input.eventType.includes('.refund.') ? 'refunded'
      : input.eventType.includes('.void.') ? 'voided'
      : input.eventType.endsWith('.fraud.held') ? 'held'
      : input.eventType.endsWith('.fraud.approved') ? 'completed'
      : input.eventType.endsWith('.fraud.declined') ? 'declined'
      : isCapture && input.responseCode === '1' ? 'completed'
      : isCapture && input.responseCode === '2' ? 'declined'
      : isCapture && input.responseCode === '4' ? 'held'
      : isCapture && input.responseCode === '3' ? 'failed' : null;
    if (eventStatus) {
      await client.query(`UPDATE donations SET status = $2, transaction_id = COALESCE(transaction_id, $3), gateway_response_code = $4,
        alert_sent_at = CASE WHEN $2 <> status THEN NULL ELSE alert_sent_at END,
        alert_error = CASE WHEN $2 <> status THEN NULL ELSE alert_error END,
        updated_at = NOW() WHERE reference = $1`, [input.reference, eventStatus, input.transactionId, input.responseCode]);
    }
    await client.query('COMMIT');
    return 'recorded';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
