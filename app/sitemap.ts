import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/config';
import { documentationLanguages, documentationSlugs, localizedDocumentationPath } from '@/lib/docs';

export default function sitemap(): MetadataRoute.Sitemap {
  const documentationPaths = documentationLanguages.flatMap((language) => [
    localizedDocumentationPath('overview', language),
    ...documentationSlugs.map((slug) => localizedDocumentationPath(slug, language)),
  ]);
  return ['/', '/pricing', ...documentationPaths].map((path) => ({ url: appUrl() + path }));
}
