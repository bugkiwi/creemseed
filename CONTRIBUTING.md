# Contributing

Use Node.js 22.18+ or 24 and the pnpm version pinned in package.json.

Run `node scripts/setup.mjs`, then `pnpm dev`. Keep personal credentials in `.env`.

Before proposing a change, run:

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm security:check
pnpm audit --audit-level high
```

Include the behavior being fixed, relevant checks and external services you actually exercised. Auth and billing changes need regression coverage. UI copy and small styling changes do not need mirrored tests. Use isolated fixtures and clean them up. Never include a customer's email, provider payload, database dump or access token in an issue or pull request.

Keep the default English README and Chinese README aligned. Keep scenario choices documented in both the CLI and AI prompt. Report security issues privately following SECURITY.md.
