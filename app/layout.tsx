import type { Metadata } from 'next';
import { site, appUrl } from '@/lib/config';
import { Analytics } from '@/components/analytics';
import { isDemoMode } from '@/lib/deployment';
import { project } from '@/lib/project';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {isDemoMode() ? (
          <div className="demo-banner">
            Open-source starter demo · Accounts and payments are disabled.{' '}
            <a href={project.repository}>Get the code ↗</a>
          </div>
        ) : null}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
