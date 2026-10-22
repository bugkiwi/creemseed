import Link from 'next/link';
import { Brand } from './brand';
import { Button } from './ui/button';
import { isDemoMode } from '@/lib/deployment';
import { project } from '@/lib/project';
import { currentUser } from '@/lib/auth/session';

export async function SiteHeader() {
  const demo = isDemoMode();
  const user = demo ? null : await currentUser();
  return (
    <header className="site-header wrap">
      <Brand />
      <nav aria-label="Main navigation">
        <Link href="/pricing">Pricing</Link>
        <Link href="/en/docs">Documentation</Link>
        {demo ? null : <Link href="/dashboard">Dashboard</Link>}
        {demo || !user ? (
          <Button asChild variant="outline">
            {demo ? (
              <a href={project.template}>
                Use template <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <Link href="/sign-in">
                Sign in <span aria-hidden="true">↗</span>
              </Link>
            )}
          </Button>
        ) : null}
      </nav>
    </header>
  );
}
