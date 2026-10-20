import { requireAdmin } from '@/lib/auth/session';
import { WorkspaceShell } from '@/components/workspace-shell';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
export default async function Layout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin(true);
  return (
    <WorkspaceShell admin name={admin.name}>
      {children}
    </WorkspaceShell>
  );
}
