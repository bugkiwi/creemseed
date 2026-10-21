# Deploy a complete application to Vercel

The GitHub Deploy button creates a credential-free demo with `DEMO_MODE=true` and `BILLING_ENABLED=false`. Those settings leave accounts, checkout, admin mutations and webhooks unavailable. To run your own product, connect your repository and configure a full application as described below.

## 1. Import the repository

In Vercel, create a project from your GitHub repository. Keep the detected Next.js framework, the repository's pinned pnpm version and the default build command. Add a production domain in **Settings → Domains** and decide which stable Preview domain you will use for provider callbacks.

## 2. Provision a private Postgres database

Create a Postgres database with a provider such as Neon. Choose a region near the Vercel function region and use the provider's pooled connection URL for runtime if available. Use a separate database or branch for Preview and testing. Add the connection URL as `DATABASE_URL` in Vercel; do not put it in a `NEXT_PUBLIC_*` variable or a build argument.

## 3. Add application settings and provider secrets

Open **Project → Settings → Environment Variables**. Add `BETTER_AUTH_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `DEMO_MODE=false` and `TRUSTED_PROXY=vercel`. Set `NEXT_PUBLIC_APP_URL` to the exact HTTPS origin of the application. Add only the email, OAuth and billing values for providers you selected.

For password sign-in, configure Resend and verify the sender domain. For Google or GitHub, register the exact production callback URL:

```text
https://YOUR_DOMAIN/api/auth/callback/google
https://YOUR_DOMAIN/api/auth/callback/github
```

Start with `CREEM_ENVIRONMENT=test` and `BILLING_ENABLED=false`; add Test products, an API key and a webhook signing secret before enabling billing in a dedicated test environment. The webhook URL is:

```text
https://YOUR_DOMAIN/api/webhooks/creem
```

See [environment setup](/docs/environment) for the source and exact handling of every variable, including optional analytics settings.

## 4. Run database migrations

Apply the committed Drizzle migrations from a trusted release environment using the same private database URL:

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
```

Run migrations before directing a new deployment at a schema it needs. Keep migration credentials in the trusted release environment and never expose database credentials to the browser.

## 5. Deploy and verify

Assign each variable only to the necessary **Preview** or **Production** environment. Use separate values for the database, auth secret, email, Creem key, webhook secret and product IDs. Save the values and create a fresh deployment; changing Vercel environment variables does not update an existing build.

In Preview, verify sign-up and verification email, selected OAuth providers, dashboard access, Test checkout, the signed webhook, trial period and admin billing tools. Run `pnpm env:check` and `pnpm billing:catalog` from a trusted local environment when diagnosing configuration. A passing configuration check does not prove end-to-end provider delivery.

Keep optional analytics disabled until you have selected a provider, enabled its flag in `starter.config.json`, configured consent and rebuilt. PostHog uses `NEXT_PUBLIC_POSTHOG_KEY` and optionally `NEXT_PUBLIC_POSTHOG_HOST`; Vercel Analytics and Speed Insights use Vercel project settings and feature flags rather than environment secrets.

## Production checklist

- `DEMO_MODE=false`, explicit `NEXT_PUBLIC_APP_URL`, and fresh `BETTER_AUTH_SECRET`.
- Private Production Postgres and committed migrations applied.
- Verified sender domain for deployed email/password sign-in.
- OAuth callbacks exactly match the Production domain.
- Creem Live products, key and webhook configured separately after Test flow validation.
- Administrator access granted only to the intended verified account.
- Optional analytics flags and consent behavior reviewed.

For Creem lifecycle and Live mode, see the [Creem guide](/docs/creem). Review [deployment operations](https://github.com/bugkiwi/creemseed/blob/main/docs/deployment.md) and the [release checklist](https://github.com/bugkiwi/creemseed/blob/main/docs/release-checklist.md) before accepting real payments.
