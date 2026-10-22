import 'server-only';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const documentationLanguages = ['en', 'zh-CN'] as const;
export type DocumentationLanguage = (typeof documentationLanguages)[number];

export function isDocumentationLanguage(value?: string | null): value is DocumentationLanguage {
  return documentationLanguages.some((language) => language === value);
}

export function localizedDocumentationPath(
  slug: DocumentationPageSlug,
  language: DocumentationLanguage,
) {
  return `/${language}/docs${slug === 'overview' ? '' : `/${slug}`}`;
}

export const documentationSlugs = [
  'features',
  'manual-install',
  'ai-install',
  'environment',
  'creem',
  'vercel',
] as const;
export type DocumentationSlug = (typeof documentationSlugs)[number];
export type DocumentationPageSlug = 'overview' | DocumentationSlug;

type DocMeta = { title: string; description: string };
const metadata: Record<DocumentationLanguage, Record<DocumentationPageSlug, DocMeta>> = {
  en: {
    overview: {
      title: 'Creemseed documentation',
      description:
        'Explore the Creemseed starter, choose an installation path, and configure your app.',
    },
    features: {
      title: 'Features',
      description: 'A complete overview of the Creemseed Next.js, Better Auth and Creem starter.',
    },
    'manual-install': {
      title: 'Manual and CLI installation',
      description:
        'Create your repository, choose your application scenario, and install Creemseed locally.',
    },
    'ai-install': {
      title: 'Install with an AI assistant',
      description: 'Use the official Creemseed setup prompt with a local coding assistant.',
    },
    environment: {
      title: 'Environment and provider setup',
      description: 'Find every environment value, where to get it, and how to configure it safely.',
    },
    creem: {
      title: 'Creem billing setup',
      description:
        'Configure Creem Test products, subscriptions, trials, webhooks and Live billing.',
    },
    vercel: {
      title: 'Deploy to Vercel',
      description: 'Deploy a complete Creemseed application with isolated Vercel environments.',
    },
  },
  'zh-CN': {
    overview: {
      title: 'Creemseed 文档',
      description: '了解 Creemseed 模板，选择安装方式并配置自己的应用。',
    },
    features: {
      title: '功能说明',
      description: '完整了解 Creemseed 的 Next.js、Better Auth 和 Creem 模板能力。',
    },
    'manual-install': {
      title: '手动与 CLI 安装',
      description: '创建自己的代码仓库，选择应用场景并在本地安装 Creemseed。',
    },
    'ai-install': {
      title: '使用 AI 助手安装',
      description: '在可访问本地仓库的 AI 编码助手中使用 Creemseed 安装提示词。',
    },
    environment: {
      title: '环境变量与服务配置',
      description: '了解每个环境变量的来源、获取步骤和安全配置方式。',
    },
    creem: {
      title: 'Creem 收款配置',
      description: '配置 Creem Test 商品、订阅、试用期、Webhook 和 Live 收款。',
    },
    vercel: {
      title: '部署到 Vercel',
      description: '在 Vercel 配置并部署完整的 Creemseed 应用，隔离不同环境。',
    },
  },
};

export function normalizeDocumentationLanguage(value?: string | string[]): DocumentationLanguage {
  const language = Array.isArray(value) ? value[0] : value;
  return isDocumentationLanguage(language) ? language : 'en';
}

export function isDocumentationSlug(value: string): value is DocumentationSlug {
  return (documentationSlugs as readonly string[]).includes(value);
}

export function documentationMetadata(
  slug: DocumentationPageSlug,
  language: DocumentationLanguage,
) {
  return metadata[language][slug];
}

export function documentationGroups(language: DocumentationLanguage) {
  if (language === 'zh-CN') {
    return [
      {
        label: '了解模板',
        items: [
          { slug: 'overview' as const, title: '文档首页' },
          { slug: 'features' as const, title: '功能说明' },
        ],
      },
      {
        label: '开始安装',
        items: [
          {
            slug: 'manual-install' as const,
            title: '手动与 CLI 安装',
          },
          { slug: 'ai-install' as const, title: 'AI 安装 Prompt' },
        ],
      },
      {
        label: '配置与发布',
        items: [
          { slug: 'environment' as const, title: '环境变量' },
          { slug: 'creem' as const, title: 'Creem 收款' },
          { slug: 'vercel' as const, title: 'Vercel 部署' },
        ],
      },
    ];
  }
  return [
    {
      label: 'Explore',
      items: [
        { slug: 'overview' as const, title: 'Documentation home' },
        { slug: 'features' as const, title: 'Features' },
      ],
    },
    {
      label: 'Install',
      items: [
        { slug: 'manual-install' as const, title: 'Manual and CLI' },
        { slug: 'ai-install' as const, title: 'AI setup prompt' },
      ],
    },
    {
      label: 'Configure',
      items: [
        { slug: 'environment' as const, title: 'Environment variables' },
        { slug: 'creem' as const, title: 'Creem billing' },
        { slug: 'vercel' as const, title: 'Vercel deployment' },
      ],
    },
  ];
}

export async function readDocumentation(
  slug: DocumentationPageSlug,
  language: DocumentationLanguage,
) {
  const file = slug === 'overview' ? 'overview.md' : `${slug}.md`;
  const source =
    slug === 'ai-install'
      ? join(process.cwd(), 'prompts', language === 'zh-CN' ? 'setup.zh-CN.md' : 'setup.md')
      : join(process.cwd(), 'docs', 'site', language, file);
  const markdown = await readFile(source, 'utf8');
  const prompt =
    slug === 'ai-install' ? markdown.match(/```text\s*\n([\s\S]*?)\n```/)?.[1] : undefined;
  return { markdown, prompt };
}
