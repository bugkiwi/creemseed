import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  documentationGroups,
  documentationMetadata,
  isDocumentationLanguage,
  localizedDocumentationPath,
  type DocumentationLanguage,
  type DocumentationPageSlug,
  readDocumentation,
} from '@/lib/docs';
import { CopyPromptButton } from './copy-prompt-button';

function localizedHref(href: string | undefined, language: DocumentationLanguage) {
  if (!href || !(href === '/docs' || href.startsWith('/docs/') || href.startsWith('/docs?')))
    return href;
  const url = new URL(href, 'https://docs.invalid');
  const linkedLanguage = url.searchParams.get('lang');
  const targetLanguage = isDocumentationLanguage(linkedLanguage) ? linkedLanguage : language;
  url.searchParams.delete('lang');
  return `/${targetLanguage}${url.pathname}${url.search}${url.hash}`;
}

export async function DocsPage({
  slug,
  language,
}: {
  slug: DocumentationPageSlug;
  language: DocumentationLanguage;
}) {
  const { markdown, prompt } = await readDocumentation(slug, language);
  const groups = documentationGroups(language);
  const title = documentationMetadata(slug, language).title;
  const chinese = language === 'zh-CN';
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1] ?? title;
  const body = markdown.replace(/^#\s+.+\n+/, '');

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="docs-page wrap" lang={language}>
        <div className="docs-toolbar">
          <Link className="docs-home-link" href={localizedDocumentationPath('overview', language)}>
            <span className="docs-mark" aria-hidden="true">
              C
            </span>
            <span>{chinese ? '文档' : 'Documentation'}</span>
          </Link>
        </div>
        <div className="docs-layout">
          <aside
            className="docs-sidebar"
            aria-label={chinese ? '文档导航' : 'Documentation navigation'}
          >
            {groups.map((group) => (
              <section className="docs-nav-group" key={group.label}>
                <h2>{group.label}</h2>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={localizedDocumentationPath(item.slug, language)}
                        aria-current={slug === item.slug ? 'page' : undefined}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </aside>
          <article className="docs-prose">
            <div className="docs-title-row">
              <h1>{heading}</h1>
              {slug === 'ai-install' && prompt ? (
                <CopyPromptButton prompt={prompt} language={language} />
              ) : null}
            </div>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children, ...props }) => (
                  <a href={localizedHref(href, language)} {...props}>
                    {children}
                  </a>
                ),
              }}
            >
              {body}
            </ReactMarkdown>
          </article>
        </div>
        <nav
          className="docs-language-switch"
          aria-label={chinese ? '文档语言' : 'Documentation language'}
        >
          <span>{chinese ? '语言' : 'Language'}</span>
          <Link
            href={localizedDocumentationPath(slug, 'en')}
            lang="en"
            aria-current={language === 'en' ? 'page' : undefined}
          >
            English
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={localizedDocumentationPath(slug, 'zh-CN')}
            lang="zh-CN"
            aria-current={language === 'zh-CN' ? 'page' : undefined}
          >
            简体中文
          </Link>
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
