import type { Metadata } from 'next';
import { DocsPage } from '@/components/docs/docs-page';
import {
  documentationMetadata,
  localizedDocumentationPath,
  normalizeDocumentationLanguage,
} from '@/lib/docs';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const { lang } = await searchParams;
  const language = normalizeDocumentationLanguage(lang);
  return {
    ...documentationMetadata('overview', language),
    alternates: { canonical: localizedDocumentationPath('overview', language) },
    robots: { index: true, follow: true },
  };
}

export default async function DocumentationHome({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { lang } = await searchParams;
  const language = normalizeDocumentationLanguage(lang);
  return <DocsPage slug="overview" language={language} />;
}
