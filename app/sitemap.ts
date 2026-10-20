import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/config';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/pricing'].map((path) => ({ url: appUrl() + path }));
}
