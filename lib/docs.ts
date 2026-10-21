import 'server-only';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const documentationLanguages = ['en', 'zh-CN'] as const;
export type DocumentationLanguage = (typeof documentationLanguages)[number];

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
  return value === 'zh-CN' ? 'zh-CN' : 'en';
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
          { slug: 'overview' as const, title: '文档首页', href: '/docs' },
          { slug: 'features' as const, title: '功能说明', href: '/docs/features' },
        ],
      },
      {
        label: '开始安装',
        items: [
          {
            slug: 'manual-install' as const,
            title: '手动与 CLI 安装',
            href: '/docs/manual-install',
          },
          { slug: 'ai-install' as const, title: 'AI 安装 Prompt', href: '/docs/ai-install' },
        ],
      },
      {
        label: '配置与发布',
        items: [
          { slug: 'environment' as const, title: '环境变量', href: '/docs/environment' },
          { slug: 'creem' as const, title: 'Creem 收款', href: '/docs/creem' },
          { slug: 'vercel' as const, title: 'Vercel 部署', href: '/docs/vercel' },
        ],
      },
    ];
  }
  return [
    {
      label: 'Explore',
      items: [
        { slug: 'overview' as const, title: 'Documentation home', href: '/docs' },
        { slug: 'features' as const, title: 'Features', href: '/docs/features' },
      ],
    },
    {
      label: 'Install',
      items: [
        { slug: 'manual-install' as const, title: 'Manual and CLI', href: '/docs/manual-install' },
        { slug: 'ai-install' as const, title: 'AI setup prompt', href: '/docs/ai-install' },
      ],
    },
    {
      label: 'Configure',
      items: [
        { slug: 'environment' as const, title: 'Environment variables', href: '/docs/environment' },
        { slug: 'creem' as const, title: 'Creem billing', href: '/docs/creem' },
        { slug: 'vercel' as const, title: 'Vercel deployment', href: '/docs/vercel' },
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
