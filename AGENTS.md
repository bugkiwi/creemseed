# Working on Creemseed

- Default application and documentation language: English. Keep README.zh-CN.md aligned with README.md.
- Read docs/architecture.md, docs/billing.md and SECURITY.md before modifying authentication or billing.
- Follow the installed Next.js documentation in node_modules/next/dist/docs/; APIs may differ from earlier releases.
- Prefer small Server Components. Keep secrets, Drizzle and provider requests on the server.
- starter.config.json contains public choices only. Secrets belong in ignored .env files or deployment secret stores. Never print them or put credentials in prompts.
- Every private page and API enforces server authorization. Check roles from the database. Additional Better Auth fields must never allow role input.
- Every browser mutation validates Origin and session; the signed webhook is the intentional Origin exception.
- Billing accepts plan keys, never client prices or customer IDs. Verify subscription ownership in server code.
- Keep checkout intent commits before external POSTs. Do not blindly retry an uncertain external mutation.
- Webhook effects and success ledger updates commit together. Do not grant access on redirects or event type alone.
- Reconcile canonical provider state under the user's lock; retain refund/dispute holds. Ignore payload email as an ownership proof.
- Optional analytics must stay disabled by default, respect consent and browser opt-out, exclude private routes, and strip URL queries.
- Setup must ask for scenario choices and use scripts/setup-schema.mjs for validation. AI setup must use the same script; preserve existing .env.
- Do not add default admin credentials, product-specific content, customer data, or existing deployment settings.
- Use isolated local databases for integration tests. Never use a configured production database for tests.
- Run pnpm typecheck, pnpm test, pnpm build, pnpm security:check and relevant integration checks after changing auth/billing. Do not describe test doubles as successful external transactions.
- Before publishing, inspect the staged diff and pnpm audit. Do not copy another repository's Git history.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
