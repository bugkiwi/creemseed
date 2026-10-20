# Install Creemseed with an AI assistant

Use this prompt in a coding assistant with local repository access:

```text
Set up this Creemseed starter for my own project.

Read AGENTS.md, SECURITY.md, docs/setup.md and scripts/setup-schema.mjs first.
Ask me the following choices before applying configuration; group short questions
where possible. Explain consequences in plain words.

1. Project name, short description and local/production origin.
2. Database: local Docker Postgres or an existing private Postgres database?
3. Sign-in: email/password, Google, GitHub, or a supported combination?
4. Email: console links for development localhost, or Resend? Explain that deployed
   password auth requires Resend. For social-only login, ask whether auth email is needed.
5. Billing: subscriptions (default), subscriptions plus one-time, or one-time only?
   Confirm catalog names/prices and currency. Monthly/yearly plans are the default.
6. Analytics: disabled (default), PostHog, Vercel Analytics, Speed Insights, or a
   combination? Ask PostHog EU/US/custom ingestion origin if selected. Consent is required.
7. Deployment: Vercel or standalone Node/Docker? For self-hosting, ask whether a
   trusted reverse proxy overwrites client IP headers.

Never request secrets in chat. Ask me to add API keys, database URLs, OAuth secrets,
email settings and product IDs directly in local .env or the deployment secret manager.
Do not read back, print, commit or put those values in the choices JSON.

After I answer, build a complete secret-free choices file using the exact shared
schema and validate it with scripts/setup-schema.mjs. Use node scripts/setup.mjs
--config /absolute/path/to/choices.json --yes --url <chosen-origin> to apply it.
Use node bin/create.mjs <empty-target> with the same flags if I requested a new directory.
Preserve existing .env; explain any local values I must update after changing choices.
If prerequisites are unavailable, use --skip-install or --skip-db and identify the
remaining exact commands. Do not pretend an external service has been configured.

Keep CREEM_ENVIRONMENT=test and BILLING_ENABLED=false initially. Do not create live
products, deploy publicly, grant admin, publish GitHub/npm, or make real charges
without my explicit instruction. Ask me to run admin:grant for my verified account.

If I request different prices, edit the server catalog and explain the exact matching
Creem product configuration. Reject unsupported trials/seats/metering unless I
explicitly commission their implementation. Do not improvise a fake recurring product.

Set public feature choices and the correct documented environment placeholders.
Run appropriate local checks after installation. Report exactly what ran, what
could not run, the start command and remaining provider setup, without exposing secrets.
```
