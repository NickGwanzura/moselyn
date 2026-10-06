import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { ensureDatabase, getPool } from '../../../../lib/backend-db';
import { getAdminCookieName, isSameOriginRequest, verifyAdminSession } from '../../../../lib/admin-auth';
import { saveBlogImage } from '../../../../lib/r2-storage';

export const runtime = 'nodejs';

function slugify(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 110);
}

async function authorized(request: Request): Promise<boolean> {
  if (!isSameOriginRequest(request)) return false;
  const jar = await cookies();
  return verifyAdminSession(jar.get(getAdminCookieName())?.value);
}

export async function POST(request: Request) {
  if (!(await authorized(request))) return Response.json({ error: 'Sign in to manage blog posts.' }, { status: 401 });
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 9 * 1024 * 1024) return Response.json({ error: 'The post upload is too large. Images must be under 8 MB.' }, { status: 413 });

  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ error: 'Could not read the post form.' }, { status: 400 }); }
  const title = String(form.get('title') ?? '').trim();
  const tag = String(form.get('tag') ?? '').trim();
  const excerpt = String(form.get('excerpt') ?? '').trim();
  const body = String(form.get('body') ?? '').trim();
  const programSlug = slugify(String(form.get('programSlug') ?? 'education-scholarship-fund')) || 'education-scholarship-fund';
  const status = form.get('status') === 'published' ? 'published' : 'draft';
  const image = form.get('image');
  if (title.length < 4 || title.length > 180 || !tag || tag.length > 80 || !body || body.length > 25_000) {
    return Response.json({ error: 'Add a title (4–180 characters), category, and story (up to 25,000 characters).' }, { status: 400 });
  }
  if (!(image instanceof File) || image.size < 1) return Response.json({ error: 'Choose a cover image to upload.' }, { status: 400 });
  const slug = slugify(String(form.get('slug') ?? title));
  if (!slug) return Response.json({ error: 'Enter a title that can form a URL slug.' }, { status: 400 });

  try { await ensureDatabase(); }
  catch (error) {
    console.error('Blog database is unavailable:', error);
    return Response.json({ error: 'The blog database is not ready. Check the Dokploy PostgreSQL connection.' }, { status: 503 });
  }
  const duplicate = await getPool().query('SELECT id FROM blog_posts WHERE slug = $1 LIMIT 1', [slug]);
  if (duplicate.rowCount) return Response.json({ error: 'A post already uses that URL slug.' }, { status: 409 });
  let uploaded: { url: string };
  try { uploaded = await saveBlogImage(image); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Image upload failed.' }, { status: 400 }); }

  try {
    await getPool().query(
      `INSERT INTO blog_posts (id, slug, title, tag, excerpt, image_url, program_slug, body, status, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $9 = 'published' THEN NOW() ELSE NULL END)`,
      [randomUUID(), slug, title, tag, excerpt.slice(0, 300), uploaded.url, programSlug, body, status],
    );
    return Response.json({ ok: true, slug }, { status: 201, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('Could not save blog post:', error);
    const { deleteBlogImage } = await import('../../../../lib/r2-storage');
    await deleteBlogImage(uploaded.url).catch((cleanupError) => console.error('Could not remove abandoned blog image:', cleanupError));
    const message = error instanceof Error && 'code' in error && error.code === '23505' ? 'A post already uses that URL slug.' : 'Could not save the post. Check the database configuration.';
    return Response.json({ error: message }, { status: 400 });
  }
}
