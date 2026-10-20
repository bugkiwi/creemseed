'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { site } from '@/lib/config';
import { Button } from './ui/button';

const Runtime = dynamic(() => import('./analytics-runtime'), { ssr: false });
export const marketingPaths = ['/', '/pricing', '/terms', '/privacy', '/refunds', '/contact'];
const enabled = Object.values(site.analytics).some(Boolean);
export function AnalyticsSettings() {
  if (!enabled) return null;
  return (
    <button
      type="button"
      className="text-button"
      onClick={() => window.dispatchEvent(new Event('analytics-settings'))}
    >
      Cookie settings
    </button>
  );
}
export function Analytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<string | null>(null),
    [open, setOpen] = useState(false),
    [browserOptOut, setBrowserOptOut] = useState(true);
  const eligible = enabled && marketingPaths.includes(pathname);
  useEffect(() => {
    if (!enabled) return;
    setBrowserOptOut(
      navigator.doNotTrack === '1' ||
        (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true,
    );
    try {
      const saved = localStorage.getItem('analytics-consent-v1');
      setConsent(saved);
      setOpen(!saved);
    } catch {
      setOpen(true);
    }
    const show = () => setOpen(true);
    window.addEventListener('analytics-settings', show);
    return () => window.removeEventListener('analytics-settings', show);
  }, []);
  function choose(choice: string) {
    setConsent(choice);
    setOpen(false);
    try {
      localStorage.setItem('analytics-consent-v1', choice);
    } catch {}
  }
  if (!eligible) return null;
  return (
    <>
      {consent === 'accepted' && !browserOptOut ? <Runtime pathname={pathname} /> : null}
      {open ? (
        <section className="consent" aria-label="Optional analytics">
          <div>
            <strong>Optional analytics</strong>
            <p>
              {browserOptOut
                ? 'Your browser asks not to be tracked. We respect that preference.'
                : 'Help us understand visits to public pages. Analytics only load if you accept.'}
            </p>
          </div>
          <div className="button-row">
            <Button variant="outline" onClick={() => choose('rejected')}>
              {browserOptOut ? 'Close' : 'Reject'}
            </Button>
            {!browserOptOut ? <Button onClick={() => choose('accepted')}>Accept</Button> : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
