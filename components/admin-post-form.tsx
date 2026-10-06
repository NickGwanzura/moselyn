'use client';

import { useState, type FormEvent } from 'react';
import SiteLink from './site-link';
import type { StoredBlogPost } from '../lib/backend-db';

const programOptions = [
  ['education-scholarship-fund', 'Education Scholarship Fund'],
  ['ruwa-home', 'Ruwa Home'],
  ['better-together', 'Better Together'],
  ['coding-and-robotics', 'Coding and robotics'],
  ['music-and-arts', 'Music and arts'],
];

export function AdminPostForm({ post }: { post?: StoredBlogPost }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    if (post && !form.get('image')?.valueOf()) form.delete('image');
    try {
      const response = await fetch(post ? `/api/admin/blog/${post.id}` : '/api/admin/blog', {
        method: post ? 'PATCH' : 'POST',
        body: form,
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not save the story.');
      window.location.assign('/admin/blog');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the story.');
      setLoading(false);
    }
  }
  return <form className="admin-post-form" onSubmit={submit}>
    <div className="admin-form-grid">
      <label>Story title<input name="title" defaultValue={post?.title} minLength={4} maxLength={180} required /></label>
      <label>URL slug<input name="slug" defaultValue={post?.slug} placeholder="generated-from-title" maxLength={110} /></label>
      <label>Category<input name="tag" defaultValue={post?.tag} placeholder="Education" maxLength={80} required /></label>
      <label>Related programme<select name="programSlug" defaultValue={post?.programSlug ?? 'education-scholarship-fund'}>{programOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label className="admin-wide">Short summary<textarea name="excerpt" defaultValue={post?.excerpt} rows={2} maxLength={300} placeholder="A short introduction for search and story cards." /></label>
      <label className="admin-wide">Story<textarea name="body" defaultValue={post?.paragraphs.join('\n\n')} rows={12} maxLength={25000} required placeholder="Write the story. Separate paragraphs with a blank line." /></label>
      <label className="admin-wide">Cover image {post && <span className="admin-muted">(leave blank to keep the current image)</span>}<input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required={!post} /></label>
      {post?.image && <div className="admin-image-preview"><img src={post.image} alt="Current cover image"/><span>Current cover image</span></div>}
      <label>Publishing status<select name="status" defaultValue={post?.status ?? 'draft'}><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label>
    </div>
    <p className="admin-upload-note">Images are stored in the FHA Cloudflare R2 bucket. Maximum 8 MB; JPEG, PNG, WebP, or AVIF.</p>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-form-actions"><SiteLink className="admin-secondary-button" href="/admin/blog">Cancel</SiteLink><button className="button button-dark" disabled={loading}>{loading ? 'Saving…' : 'Save story'}</button></div>
  </form>;
}
