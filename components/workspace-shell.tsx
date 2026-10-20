import Link from 'next/link';
import { Brand } from './brand';
import { SignOut } from './sign-out';

export function WorkspaceShell({
  children,
  admin,
  name,
  isAdmin,
}: {
  children: React.ReactNode;
  admin?: boolean;
  name: string;
  isAdmin?: boolean;
}) {
  const links = admin
    ? [
        ['/admin', 'Overview'],
        ['/admin/customers', 'Customers'],
        ['/admin/subscriptions', 'Subscriptions'],
        ['/admin/checkouts', 'Checkouts'],
        ['/admin/events', 'Webhooks'],
        ['/admin/audit', 'Audit log'],
      ]
    : [
        ['/dashboard', 'Overview'],
        ['/dashboard/billing', 'Billing'],
      ];
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-section">
          <p className="eyebrow">{admin ? 'ADMIN DESK' : 'YOUR WORKSPACE'}</p>
          <nav aria-label={admin ? 'Admin navigation' : 'Workspace navigation'}>
            {links.map(([href, label]) => (
              <Link href={href} key={href}>
                {label}
              </Link>
            ))}
            {isAdmin && !admin ? <Link href="/admin">Admin desk ↗</Link> : null}
            {admin ? <Link href="/dashboard">Workspace ↗</Link> : null}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <span className="small muted">{name}</span>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-top">
          <span>{admin ? 'Operations' : 'Personal workspace'}</span>
          <div className="button-row">
            <Link href="/">Visit website ↗</Link>
            <SignOut />
          </div>
        </header>
        <main id="main-content" className="workspace-main">
          {children}
        </main>
      </div>
    </div>
  );
}
