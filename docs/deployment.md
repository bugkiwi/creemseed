# Deployment

## Common preparation

1. Replace example product names/prices and policy/contact placeholders. Configure email and optional OAuth apps.
2. Set a dedicated public HTTPS `NEXT_PUBLIC_APP_URL`; use exact `/api/auth/callback/google` and `/api/auth/callback/github` callbacks for selected providers.
3. Provision private Postgres. Use a runtime pooler for serverless connections. `prepare: false` supports transaction pooling. Give migration tooling a compatible migration connection; run `pnpm db:migrate` before promoting the release.
4. Configure a fresh `BETTER_AUTH_SECRET` of at least 32 random characters, never an example or a reused local value. Set secrets directly in the deployment secret manager.
5. Select a real mail transport for deployed password login. Verify sender-domain DNS and delivery; do not turn console links into a production fallback.
6. Start with Creem test mode. Register `/api/webhooks/creem` and complete docs/release-checklist.md. Use separate live configuration and data when enabling real charges.
7. Set a trusted proxy mode appropriate to the host, add edge request limits and keep database/admin tooling private.

`starter.config.json`, public `NEXT_PUBLIC_*` values and enabled browser providers affect build output. Rebuild after changing them. Database, auth, Creem and Resend secrets are runtime variables and must not become Docker build arguments.

## Vercel

Import the GitHub repository, select the Next.js framework, and keep the pinned pnpm install with `--frozen-lockfile`. Configure all selected environment variables separately for development, preview and production. Use test billing for previews; never hand preview deployments live customer databases or production credentials by default.

Set `TRUSTED_PROXY=vercel` only when actually running behind Vercel's managed request headers. Keep `NEXT_PUBLIC_APP_URL` an explicit stable origin registered with auth providers. Arbitrary preview hosts are not automatically trusted.

Apply migrations in a trusted release step, then deploy. Billing routes use the Node runtime and request a 60-second maximum duration; confirm your plan supports this. Canonical reconciliation can call multiple provider endpoints. If your runtime budget is insufficient, move event processing behind a durable queue with leases and idempotent jobs before accepting payments. The starter does not claim every Vercel plan supports the full timeout.

`@vercel/analytics` and `@vercel/speed-insights` are separate feature flags. They remain disabled unless selected. Enable their host services as needed, obtain consent, and confirm requests exclude private routes.

## Standalone Node / Docker

```sh
docker build --build-arg NEXT_PUBLIC_APP_URL=https://app.example.com -t my-app .
docker run --rm -p 3000:3000 --env-file /secure/path/app.env my-app
```

Run migrations from a separate trusted checkout/container with dev dependencies before the new app version is promoted. The final image contains only standalone runtime output, static assets and public files; no `.env`, source history or private key is copied into the build context. Do not add secrets with build args.

The application process runs as a non-root user. Set up a TLS reverse proxy, health monitoring, restart policy and private database access. If your proxy overwrites `X-Real-IP`, set `TRUSTED_PROXY=x-real-ip` and block direct access that could inject forged headers. Otherwise keep `none` and add appropriate edge authentication limits. Do not trust raw client-provided forwarded-for values.

The checked-in compose file is for local Postgres only. It is not a production database deployment.

## Operations

Watch failed webhook records and unresolved checkouts. Provider retries are finite. Reconcile from the admin desk when needed; add scheduled reconciliation/alerts for stronger operational guarantees. Back up the database, rehearse restore, manage retention of auth IP/user-agent data and audit records, and review your provider's current API and security notices before updates.
