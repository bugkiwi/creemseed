import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/config';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/api',
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
