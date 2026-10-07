import type { ReactNode } from 'react';
import SiteLink from './site-link';

export function AdminShell({ children, active }: { children: ReactNode; active: 'overview' | 'blog' | 'invites' | 'payments' }) {
  return <main className="admin-page">
    <header className="admin-header"><SiteLink className="admin-wordmark" href="/admin">FHA <span>ADMIN</span></SiteLink><nav aria-label="Admin navigation"><SiteLink className={active === 'overview' ? 'active' : ''} href="/admin">Overview</SiteLink><SiteLink className={active === 'blog' ? 'active' : ''} href="/admin/blog">Blog</SiteLink><SiteLink className={active === 'invites' ? 'active' : ''} href="/admin/invites">Invites</SiteLink><SiteLink className={active === 'payments' ? 'active' : ''} href="/admin/payments">Payments</SiteLink><SiteLink href="/" target="_blank" rel="noreferrer">View site ↗</SiteLink></nav><form action="/api/admin/logout" method="post"><button className="admin-signout" type="submit">Sign out</button></form></header>
    <div className="admin-content">{children}</div>
  </main>;
}
