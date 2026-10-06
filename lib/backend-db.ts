import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { blogStories, type BlogStory } from './blog-stories';

export type StoredBlogPost = BlogStory & {
  id: string;
  excerpt: string;
  status: 'draft' | 'published';
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
      CREATE TABLE IF NOT EXISTS admin_login_attempts (
        identity_hash CHAR(64) PRIMARY KEY,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
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
    status: row.status === 'published' ? 'published' : 'draft',
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

const BLOG_COLUMNS = 'id, slug, title, tag, excerpt, image_url, program_slug, body, status, published_at, created_at, updated_at';

export async function getPublishedBlogPosts(): Promise<StoredBlogPost[]> {
  if (!hasDatabase()) return blogStories.map((post, index) => ({
    ...post,
    id: `seed-${index}`,
    excerpt: post.paragraphs[0] ?? '',
    status: 'published',
    publishedAt: null,
    createdAt: '',
    updatedAt: '',
  }));
  await ensureDatabase();
  const result = await getPool().query(`SELECT ${BLOG_COLUMNS} FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC NULLS LAST, created_at DESC`);
  return result.rows.map(toBlogPost);
}

export async function getBlogPostBySlug(slug: string): Promise<StoredBlogPost | null> {
  if (!hasDatabase()) {
    const post = blogStories.find((story) => story.slug === slug);
    return post ? { ...post, id: `seed-${slug}`, excerpt: post.paragraphs[0] ?? '', status: 'published', publishedAt: null, createdAt: '', updatedAt: '' } : null;
  }
  await ensureDatabase();
  const result = await getPool().query(`SELECT ${BLOG_COLUMNS} FROM blog_posts WHERE slug = $1 AND status = 'published' LIMIT 1`, [slug]);
  return result.rows[0] ? toBlogPost(result.rows[0]) : null;
}

export async function getAdminBlogPosts(): Promise<StoredBlogPost[]> {
  await ensureDatabase();
  const result = await getPool().query(`SELECT ${BLOG_COLUMNS} FROM blog_posts ORDER BY updated_at DESC`);
  return result.rows.map(toBlogPost);
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

export async function getDonationDashboard(): Promise<{ totalCompleted: string; completedCount: number; pendingCount: number; recent: DonationRecord[] }> {
  await ensureDatabase();
  const pool = getPool();
  const [summary, records] = await Promise.all([
    pool.query<{ total: string; completed: string; pending: string }>(`SELECT COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)::text AS total,
      COUNT(*) FILTER (WHERE status = 'completed')::text AS completed,
      COUNT(*) FILTER (WHERE status = 'pending')::text AS pending FROM donations`),
    pool.query(`SELECT id, reference, amount::text, currency, status, transaction_id, created_at, updated_at FROM donations ORDER BY created_at DESC LIMIT 100`),
  ]);
  return {
    totalCompleted: summary.rows[0]?.total ?? '0',
    completedCount: Number(summary.rows[0]?.completed ?? 0),
    pendingCount: Number(summary.rows[0]?.pending ?? 0),
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
      await client.query(`UPDATE donations SET status = $2, transaction_id = COALESCE(transaction_id, $3), gateway_response_code = $4, updated_at = NOW()
        WHERE reference = $1`, [input.reference, eventStatus, input.transactionId, input.responseCode]);
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
