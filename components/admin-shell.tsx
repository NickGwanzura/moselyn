import type { ReactNode } from 'react';
import SiteLink from './site-link';

type AdminSection = 'overview' | 'blog' | 'invites' | 'payments' | 'users';

const navigation: Array<{ key: AdminSection; label: string; href: string; icon: string }> = [
  { key: 'overview', label: 'Overview', href: '/admin', icon: '◫' },
  { key: 'blog', label: 'Blog & stories', href: '/admin/blog', icon: '▤' },
  { key: 'users', label: 'Users', href: '/admin/users', icon: '♙' },
  { key: 'invites', label: 'Invitations', href: '/admin/invites', icon: '✉' },
  { key: 'payments', label: 'Payments', href: '/admin/payments', icon: '＄' },
];

export function AdminShell({ children, active }: { children: ReactNode; active: AdminSection }) {
  return <main className="admin-layout">
    <aside className="admin-sidebar">
      <SiteLink className="admin-brand" href="/admin"><span className="admin-brand-mark">FHA</span><span><strong>Finding Hope</strong><small>ADMIN CONSOLE</small></span></SiteLink>
      <p className="admin-nav-label">WORKSPACE</p>
      <nav className="admin-sidebar-nav" aria-label="Admin navigation">{navigation.map((item) => <SiteLink key={item.key} className={active === item.key ? 'active' : ''} href={item.href}><span aria-hidden="true">{item.icon}</span>{item.label}</SiteLink>)}</nav>
      <div className="admin-sidebar-bottom"><SiteLink className="admin-view-site" href="/" target="_blank" rel="noreferrer"><span aria-hidden="true">↗</span> View website</SiteLink><form action="/api/admin/logout" method="post"><button className="admin-signout" type="submit"><span aria-hidden="true">⇥</span> Sign out</button></form><small>Finding Hope Africa<br/>Secure administration</small></div>
    </aside>
    <section className="admin-main"><header className="admin-topbar"><span>Finding Hope Africa <span aria-hidden="true">/</span> <strong>Admin</strong></span><span className="admin-online"><i/> Private workspace</span></header><div className="admin-content">{children}</div></section>
  </main>;
}
