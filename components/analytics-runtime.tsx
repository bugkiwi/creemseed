'use client';
import { useEffect, useRef, useState } from 'react';
import type { PostHog, PostHogConfig } from 'posthog-js';
import dynamic from 'next/dynamic';
import { site } from '@/lib/config';
import { marketingPaths } from './analytics';

const VercelAnalytics = dynamic(() => import('@vercel/analytics/next').then((m) => m.Analytics), {
  ssr: false,
});
const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((m) => m.SpeedInsights),
  { ssr: false },
);
let posthogInitialized = false;
function safeEvent<T extends { url: string }>(event: T): T | null {
  const url = new URL(event.url, window.location.origin);
  if (!marketingPaths.includes(url.pathname)) return null;
  return { ...event, url: url.origin + url.pathname };
}
export default function AnalyticsRuntime({ pathname }: { pathname: string }) {
  const activeClient = useRef<PostHog | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!site.analytics.posthog || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    let cancelled = false;
    let client: (typeof import('posthog-js'))['default'] | undefined;
    void import('posthog-js')
      .then(({ default: posthog }) => {
        if (cancelled) return;
        client = posthog;
        const options: Partial<PostHogConfig> = {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
          disable_session_recording: true,
          persistence: 'memory',
          person_profiles: 'identified_only',
          advanced_disable_feature_flags: true,
          before_send: (event) => {
            if (!event || cancelled || !marketingPaths.includes(window.location.pathname))
              return null;
            const safe = window.location.origin + window.location.pathname;
            event.properties.$current_url = safe;
            event.properties.$pathname = window.location.pathname;
            event.properties.$referrer = '';
            event.properties.$referring_domain = '';
            delete event.properties.$initial_current_url;
            delete event.properties.$initial_referrer;
            return event;
          },
        };
        if (!posthogInitialized) {
          posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, options);
          posthogInitialized = true;
        } else posthog.set_config(options);
        posthog.opt_in_capturing();
        activeClient.current = posthog;
        setReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      activeClient.current = null;
      client?.opt_out_capturing();
      client?.reset();
    };
  }, []);
  useEffect(() => {
    if (ready)
      activeClient.current?.capture('$pageview', {
        $current_url: window.location.origin + pathname,
        $pathname: pathname,
      });
  }, [pathname, ready]);
  return (
    <>
      {site.analytics.vercel ? <VercelAnalytics beforeSend={safeEvent} /> : null}
      {site.analytics.speedInsights ? <SpeedInsights beforeSend={safeEvent} /> : null}
    </>
  );
}
