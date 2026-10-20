import Link from 'next/link';
import { Brand } from './brand';
import { Button } from './ui/button';
import { isDemoMode } from '@/lib/deployment';
import { project } from '@/lib/project';

export function SiteHeader() {
  const demo = isDemoMode();
  return (
    <header className="site-header wrap">
      <Brand />
      <nav aria-label="Main navigation">
        <Link href="/pricing">Pricing</Link>
        {demo ? (
          <a href={project.documentation}>Documentation</a>
        ) : (
          <Link href="/dashboard">Dashboard</Link>
        )}
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
      </nav>
    </header>
  );
}
