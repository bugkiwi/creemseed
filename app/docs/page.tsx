import type { Metadata } from 'next';
import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

type Language = 'en' | 'zh-CN';

function normalizeLanguage(value?: string | string[]): Language {
  return value === 'zh-CN' ? 'zh-CN' : 'en';
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const { lang } = await searchParams;
  const chinese = normalizeLanguage(lang) === 'zh-CN';
  return {
    title: chinese ? '环境变量与服务配置' : 'Environment and provider setup',
    description: chinese
      ? '获取和配置 Creemseed 所需的 Vercel、数据库、认证、支付、邮件与可选分析服务变量。'
      : 'Find and configure the Vercel, database, auth, billing, email, and optional analytics values used by Creemseed.',
    robots: { index: true, follow: true },
  };
}

export default async function DocumentationPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { lang } = await searchParams;
  const language = normalizeLanguage(lang);
  const chinese = language === 'zh-CN';
  const document = await readFile(
    join(process.cwd(), 'docs', chinese ? 'environment.zh-CN.md' : 'environment.en.md'),
    'utf8',
  );

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="docs-page wrap" lang={language}>
        <div className="docs-toolbar">
          <p className="eyebrow">{chinese ? 'CREEMSEED 使用指南' : 'CREEMSEED GUIDES'}</p>
          <nav aria-label={chinese ? '文档语言' : 'Documentation language'}>
            <Link
              href="/docs?lang=en"
              lang="en"
              aria-current={language === 'en' ? 'page' : undefined}
            >
              EN
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/docs?lang=zh-CN"
              lang="zh-CN"
              aria-current={language === 'zh-CN' ? 'page' : undefined}
            >
              简体中文
            </Link>
          </nav>
        </div>
        <article className="docs-prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                let destination = href;
                if (href?.startsWith('./') && href.endsWith('.md')) {
                  const file = href.slice(2);
                  destination =
                    file === 'environment.zh-CN.md'
                      ? '/docs?lang=zh-CN'
                      : file === 'environment.en.md'
                        ? '/docs?lang=en'
                        : `https://github.com/bugkiwi/creemseed/blob/main/docs/${file}`;
                }
                return <a href={destination}>{children}</a>;
              },
            }}
          >
            {document}
          </ReactMarkdown>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
