# Documentation source layout

The `docs/` directory keeps public product documentation separate from contributor and operations references:

- `site/en/` and `site/zh-CN/` contain bilingual Markdown rendered on the public `/docs` website. Keep the English pages complete and update their Chinese counterparts in the same change.
- `../prompts/setup.md` and `../prompts/setup.zh-CN.md` are the canonical AI installation prompts. The docs website reads these files directly, including the copyable prompt, so do not maintain another copy of the prompt in `site/`.
- The Markdown files at this directory's root (`architecture.md`, `billing.md`, `deployment.md`, `setup.md`, `release-checklist.md`, `verification.md`, and `publishing.md`) are engineering and operator references. Public docs can link to their GitHub source when a detailed operational procedure is needed.

The docs route is implemented in `app/docs/` and `components/docs/`; the catalog, locale selection and Markdown source allowlist live in `lib/docs.ts`. Keep source paths allowlisted rather than deriving arbitrary filesystem paths from request parameters. Next.js standalone output tracing for these routes is configured in `next.config.ts`.

The site defaults to English. Chinese pages use `?lang=zh-CN`, and every public documentation link should retain the selected language when it points to another `/docs` route.
