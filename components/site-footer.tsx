import Link from 'next/link';
import { site } from '@/lib/config';
import { AnalyticsSettings } from './analytics';

export function SiteFooter() {
  return (
    <footer className="site-footer wrap">
      <span>
        © {new Date().getFullYear()} {site.name}
      </span>
      <nav aria-label="Footer">
        <Link href="/docs">Documentation</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/refunds">Refunds</Link>
        <Link href="/contact">Contact</Link>
        <AnalyticsSettings />
      </nav>
    </footer>
  );
}
