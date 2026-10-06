import { cookies } from 'next/headers';
import { ensureDatabase, getPool } from '../../../../../lib/backend-db';
import { getAdminCookieName, isSameOriginRequest, verifyAdminSession } from '../../../../../lib/admin-auth';
import { deleteBlogImage, saveBlogImage } from '../../../../../lib/r2-storage';

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };

async function authorized(request: Request): Promise<boolean> {
  if (!isSameOriginRequest(request)) return false;
  const jar = await cookies();
  return verifyAdminSession(jar.get(getAdminCookieName())?.value);
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await authorized(request))) return Response.json({ error: 'Sign in to manage blog posts.' }, { status: 401 });
  const { id } = await context.params;
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 9 * 1024 * 1024) return Response.json({ error: 'The post upload is too large.' }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ error: 'Could not read the post form.' }, { status: 400 }); }
  const title = String(form.get('title') ?? '').trim();
  const tag = String(form.get('tag') ?? '').trim();
  const excerpt = String(form.get('excerpt') ?? '').trim();
  const body = String(form.get('body') ?? '').trim();
  const slug = String(form.get('slug') ?? '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 110);
  const programSlug = String(form.get('programSlug') ?? 'education-scholarship-fund').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const status = form.get('status') === 'published' ? 'published' : 'draft';
  const image = form.get('image');
  if (title.length < 4 || title.length > 180 || !tag || tag.length > 80 || !body || body.length > 25_000 || !slug) {
    return Response.json({ error: 'Check title, category, URL slug, and story text.' }, { status: 400 });
  }
  await ensureDatabase();
  const pool = getPool();
  const previous = await pool.query<{ image_url: string }>('SELECT image_url FROM blog_posts WHERE id = $1', [id]);
  if (!previous.rowCount) return Response.json({ error: 'Post not found.' }, { status: 404 });
  let imageUrl = previous.rows[0].image_url;
  if (image instanceof File && image.size > 0) {
    try { imageUrl = (await saveBlogImage(image)).url; }
    catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Image upload failed.' }, { status: 400 }); }
  }
  try {
    const result = await pool.query(
      `UPDATE blog_posts SET slug = $2, title = $3, tag = $4, excerpt = $5, image_url = $6, program_slug = $7, body = $8,
        status = $9, published_at = CASE WHEN $9 = 'published' THEN COALESCE(published_at, NOW()) ELSE NULL END, updated_at = NOW()
       WHERE id = $1 RETURNING id`,
      [id, slug, title, tag, excerpt.slice(0, 300), imageUrl, programSlug, body, status],
    );
    if (!result.rowCount) return Response.json({ error: 'Post not found.' }, { status: 404 });
    if (imageUrl !== previous.rows[0].image_url) void deleteBlogImage(previous.rows[0].image_url).catch((error) => console.error('Could not remove old blog image:', error));
    return Response.json({ ok: true, slug }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('Could not update blog post:', error);
    const message = error instanceof Error && 'code' in error && error.code === '23505' ? 'A post already uses that URL slug.' : 'Could not update the post.';
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await authorized(request))) return Response.json({ error: 'Sign in to manage blog posts.' }, { status: 401 });
  const { id } = await context.params;
  await ensureDatabase();
  const result = await getPool().query<{ image_url: string }>('DELETE FROM blog_posts WHERE id = $1 RETURNING image_url', [id]);
  if (!result.rowCount) return Response.json({ error: 'Post not found.' }, { status: 404 });
  await deleteBlogImage(result.rows[0].image_url).catch((error) => console.error('Could not remove blog image:', error));
  return Response.json({ ok: true });
}
