import { requireUser } from '@/lib/auth/session';
import { WorkspaceShell } from '@/components/workspace-shell';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Workspace', robots: { index: false, follow: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(true);
  return (
    <WorkspaceShell name={user.name} isAdmin={user.role === 'admin'}>
      {children}
    </WorkspaceShell>
  );
}
