import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsPage } from '@/components/docs/docs-page';
import {
  documentationMetadata,
  documentationSlugs,
  isDocumentationSlug,
  normalizeDocumentationLanguage,
} from '@/lib/docs';

export function generateStaticParams() {
  return documentationSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const [{ slug }, { lang }] = await Promise.all([params, searchParams]);
  if (!isDocumentationSlug(slug)) return {};
  const language = normalizeDocumentationLanguage(lang);
  return { ...documentationMetadata(slug, language), robots: { index: true, follow: true } };
}

export default async function DocumentationArticle({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const [{ slug }, { lang }] = await Promise.all([params, searchParams]);
  if (!isDocumentationSlug(slug)) notFound();
  const language = normalizeDocumentationLanguage(lang);
  return <DocsPage slug={slug} language={language} />;
}
