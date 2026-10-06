'use client';

export function AdminPostDelete({ id }: { id: string }) {
  async function remove() {
    if (!window.confirm('Delete this story and its uploaded cover image?')) return;
    const response = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    if (response.ok) window.location.reload();
    else window.alert('Could not delete this story. Please try again.');
  }
  return <button className="admin-delete-button" type="button" onClick={remove}>Delete</button>;
}
