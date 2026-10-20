import Link from 'next/link';
import { Brand } from './brand';
import { Button } from './ui/button';

export function SiteHeader() {
  return (
    <header className="site-header wrap">
      <Brand />
      <nav aria-label="Main navigation">
        <Link href="/pricing">Pricing</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Button asChild variant="outline">
          <Link href="/sign-in">
            Sign in <span aria-hidden="true">↗</span>
          </Link>
        </Button>
      </nav>
    </header>
  );
}
