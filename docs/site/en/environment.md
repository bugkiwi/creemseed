# Environment variables and provider setup

This guide explains every variable in `.env.example`, the local-only values created by the setup wizard, and the Vercel values provided by the platform. The page is also available in [简体中文](/docs/environment?lang=zh-CN). English is the default.

## Before you start

Choose the application shape in `starter.config.json` first: authentication methods, email transport, billing mode, optional analytics, and deployment target. A credential does not enable a feature on its own. For example, Google credentials are used only when `google` is selected in `auth`; PostHog requires its flag to be enabled; billing requires `BILLING_ENABLED=true` and a valid product catalog.

The interactive installer makes these choices for you:

```sh
node scripts/setup.mjs
```

The AI-assisted path uses the same installer and asks you to select the same scenario before writing configuration. Read [manual installation](/docs/manual-install) for unattended installation and [Vercel deployment](/docs/vercel) for hosting.

### Keep environments separate

Use separate credentials and preferably separate databases for local development, Vercel Preview, and Vercel Production. Keep Creem Test credentials, products, and webhook endpoint together; keep Live credentials, products, and endpoint together. Never put a Live key in Preview or a Test webhook secret in Production.

| Where the app runs | `DEMO_MODE`                 | Creem                                                       | Database                       |
| ------------------ | --------------------------- | ----------------------------------------------------------- | ------------------------------ |
| Public demo        | `true`                      | Not used; billing stays disabled                            | Not required                   |
| Local development  | `false`                     | Test, normally disabled until configured                    | Local or development database  |
| Vercel Preview     | `false` for a real test app | Test only                                                   | Separate preview/test database |
| Vercel Production  | `false`                     | Test until release approval; Live only when ready to charge | Production database            |

The hosted public demo intentionally uses `DEMO_MODE=true` and `BILLING_ENABLED=false`. A full application needs its own database, auth secret, email sender, domain, and provider credentials.

## Add values to Vercel

1. Open **Vercel Dashboard → your project → Settings → Environment Variables**.
2. Add each variable using the exact name shown below. Select **Development**, **Preview**, and/or **Production** deliberately. Keep Preview isolated from production data and Live payment credentials.
3. Save the values, then create a new deployment. Environment changes do not update deployments that already exist.
4. For local use, link the repository with `vercel link`, then pull only the Development values into an ignored file:

   ```sh
   vercel env pull .env.local
   ```

   Next.js loads `.env.local`. For project commands that use `dotenv` (such as migrations), point `dotenv` at the same file:

   ```sh
   DOTENV_CONFIG_PATH=.env.local pnpm db:migrate
   DOTENV_CONFIG_PATH=.env.local pnpm env:check
   ```

   The setup wizard writes `.env` instead. Do not overwrite it with a production export or commit either file.

Use the Vercel UI or CLI to enter secrets. Do not paste secrets into GitHub, issue trackers, chat prompts, screenshots, or public configuration files. `NEXT_PUBLIC_*` values are intentionally included in browser bundles; never put secrets in them.

## Core application settings

| Variable              | Required when                                                 | Where it comes from and how to set it                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL` | Every full application; optional for the credential-free demo | Set this to the canonical origin you control, such as `https://app.example.com`. Use the Vercel production domain if you have not added a custom domain. Do not add a path, query, credentials, or trailing route. For local development use `http://localhost:3000`. This value is public and is used to build auth callback and canonical URLs. Set a matching origin for each deploy environment where callbacks must work.                   |
| `DEMO_MODE`           | Every deployment                                              | Choose `true` only for a public, no-account/no-payment preview. Choose `false` for your own working app. The Vercel Deploy button defaults to `true`; the CLI wizard defaults to a full app. Set it for both the build and runtime deployment environment, then redeploy. Demo mode returns unavailable responses from auth, billing, admin mutation, and webhook APIs.                                                                          |
| `DATABASE_URL`        | Full app                                                      | Create a PostgreSQL database with a provider such as Neon, then copy its connection URI from the provider's **Connect** page. For a Vercel serverless runtime, use the provider's pooled connection URL if offered. Keep the username, password, host, port, and database name intact; URL-encode reserved characters in credentials. The example URL is only a placeholder.                                                                     |
| `BETTER_AUTH_SECRET`  | Full app                                                      | Generate a fresh random value locally, for example `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Store the result directly in Vercel or your local secret manager. Do not reuse the example, another project's secret, or the same value across unrelated apps. It must be at least 32 characters.                                                                                                           |
| `ADMIN_EMAILS`        | Optional admin bootstrap                                      | Set a comma-separated list of intended administrator emails, such as `you@example.com,ops@example.com`. Matching accounts must exist and have verified email; their first `/admin` request stores the admin role in Postgres and writes an audit record. This is server-only; never prefix it with `NEXT_PUBLIC_`. Removing an address does not revoke a stored role; remove it from the list, redeploy, then use `pnpm admin:revoke --email …`. |
| `TRUSTED_PROXY`       | Optional locally; set for a deployed app when applicable      | Use `vercel` when the app is actually served by Vercel. Use `x-real-ip` only behind a proxy that overwrites that header and blocks direct access. Use `none` otherwise. This affects which client IP header rate limiting trusts; it is not a substitute for edge rate limits.                                                                                                                                                                   |

### Postgres on Vercel

Create a database in your database provider, choose the production region near your Vercel functions, and copy its pooled connection URL into `DATABASE_URL` for the Vercel serverless runtime. Use a dedicated development/Preview database or branch; do not run Preview deployments against production data. Apply committed migrations using a trusted release step before sending traffic to a new schema. See [Neon's connection guide](https://neon.com/docs/connect/connect-from-any-app) and [connection pooling guide](https://neon.com/docs/connect/connection-pooling) for Neon-specific setup.

## Creem payments

Start with Test mode. A Vercel Preview build is a good place to test, provided it uses a test database and Test credentials. The built-in subscription catalog expects Pro at **$9.90/month** and **$99/year**, both USD, recurring, tax inclusive, with a **7-day trial**. `hybrid` and `onetime` modes also use a **$299 one-time** product. If you change the server catalog in `lib/billing/plans.ts`, create matching products in Creem.

| Variable                    | Required when                          | Where it comes from and how to set it                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CREEM_ENVIRONMENT`         | Full app; use `test` for initial setup | Select `test` or `live`. This chooses Creem's API host and is checked against the key and remote products. Test and Live are separate environments. Never use a Live key with `test`, or the reverse.                                                                                                                                                                                                                              |
| `BILLING_ENABLED`           | Every deployment                       | Keep `false` while creating products, adding webhook configuration, or checking credentials. Set `true` only after `pnpm billing:catalog` succeeds against the intended environment and you have tested checkout and webhooks. It must stay `false` in demo mode.                                                                                                                                                                  |
| `CREEM_API_KEY`             | Billing enabled                        | In the [Creem dashboard](https://www.creem.io), select the correct Test or Production mode, then open **Developers → API Keys** and copy that environment's key. Test and Live keys differ. Add it as a sensitive Vercel variable.                                                                                                                                                                                                 |
| `CREEM_WEBHOOK_SECRET`      | Billing enabled                        | In Creem, open **Developers → Webhooks**, create an endpoint for `https://YOUR_DOMAIN/api/webhooks/creem`, and copy the endpoint signing secret. Select the subscription events documented in [billing operations](https://github.com/bugkiwi/creemseed/blob/main/docs/billing.md#webhook-coverage), plus `checkout.completed`, `refund.created`, and `dispute.created`. Test and Production endpoints each have their own secret. |
| `CREEM_PRODUCT_PRO_MONTHLY` | `subscriptions` or `hybrid` billing    | Create a recurring monthly product in the same Creem mode as the key. Match the code catalog's amount, USD currency, tax mode, and 7-day trial. Copy the product ID (usually `prod_…`) from its dashboard page.                                                                                                                                                                                                                    |
| `CREEM_PRODUCT_PRO_YEARLY`  | `subscriptions` or `hybrid` billing    | Create a recurring yearly product in the same mode. Match the code catalog's amount, USD currency, tax mode, and 7-day trial, then copy its product ID.                                                                                                                                                                                                                                                                            |
| `CREEM_PRODUCT_LIFETIME`    | `hybrid` or `onetime` billing          | Create a one-time product in the same mode. Match the amount, currency, and tax configuration in `lib/billing/plans.ts`; copy its product ID. It is not needed for subscriptions-only billing.                                                                                                                                                                                                                                     |

After creating products and configuring all required values, run the read-only catalog check locally with that environment's values:

```sh
pnpm billing:catalog
```

It checks product IDs, mode, currency, recurring interval, amount, tax, trial, and usage pricing. Then enable billing for that same environment, redeploy, and use Creem Test Mode's test payment flow. A return URL does not prove payment; the signed webhook is part of the test. Follow the [release checklist](https://github.com/bugkiwi/creemseed/blob/main/docs/release-checklist.md) before switching to Live.

Creem's dashboard navigation and API key locations are described in its [dashboard guide](https://docs.creem.io/getting-started/dashboard-overview), [Test Mode guide](https://docs.creem.io/getting-started/test-mode), and [webhook guide](https://docs.creem.io/code/webhooks).

## Email with Resend

Email can remain `console` for local-only development. A deployed email/password flow needs a real mail transport; the current setup selects Resend for that case. Social-only auth does not require Resend unless your app sends other transactional email.

| Variable         | Required when                        | Where it comes from and how to set it                                                                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY` | `starter.config.json` selects Resend | Create or select a Resend project, open **API Keys**, and create a key with the minimum access needed for sending. Copy it once and save it as a sensitive secret. Never use a personal API key from another service.                                                                                            |
| `EMAIL_FROM`     | Resend selected                      | Add a domain you own under **Domains** in Resend. Publish the exact DNS records Resend gives you at your DNS provider and wait until the domain is verified. Set a sender on that verified domain, for example `My App <no-reply@mail.example.com>`. Do not use an unverified sender or a public mailbox domain. |

Read Resend's [API key guide](https://resend.com/docs/dashboard/api-keys/introduction) and [verified domain guide](https://resend.com/docs/dashboard/domains/introduction). Keep transactional email on a dedicated subdomain if you want to separate its reputation.

## Optional Google and GitHub sign-in

Credentials alone do not show a sign-in method. Add `google` or `github` to the `auth` array in `starter.config.json`, then redeploy. Configure a separate OAuth app/client for local development and production when their callback hosts differ.

### Create a Google OAuth application

This starter uses Better Auth's server-side OAuth redirect flow. Google sends the user back to the exact callback URI shown below; the app does not use Google's browser JavaScript sign-in SDK.

1. **Select Google sign-in in the app.** Choose Google in `node scripts/setup.mjs`, or add `google` to `starter.config.json` → `auth`. Keep `NEXT_PUBLIC_APP_URL` set to the origin for the environment you are configuring.
2. **Create or select a Google Cloud project.** Open [Google Cloud Console](https://console.cloud.google.com/), choose the intended project, then open **Google Auth Platform**. If the platform asks you to register an app, choose **Get started**.
3. **Set up the app information under Branding.** Use the product name users will recognize, choose a support email you monitor, and provide the public homepage, privacy policy and terms links on a domain you control. Add the domain under **Authorized domains** if the console asks for it. Do not use a placeholder or a domain you cannot verify.
4. **Choose an audience.** For a product that accepts ordinary Google accounts, choose **External**. Use **Internal** only when access should be limited to accounts in your own Google Workspace organization. During development, keep the app in **Testing** and add the Google accounts you plan to use under **Audience → Test users**.
5. **Keep the requested data access minimal.** This starter's Google provider asks for only `openid`, `email` and `profile`, which are the standard identity scopes for sign-in. Do not add Drive, Gmail or other Google API scopes unless the product needs them. Google's current guidance says Testing supports up to 100 listed users in general. For Sign in with Google requests limited to basic identity scopes, Google documents an exception to the test-user allowlist and seven-day authorization expiry; still list your development accounts while testing. If you add scopes, check the Audience and Verification Center requirements again.
6. **Create a web OAuth client.** Open **Google Auth Platform → Clients → Create client**, choose **Web application**, and give it a clear name such as `My App – Production`. Add each exact callback under **Authorized redirect URIs**:

   ```text
   http://localhost:3000/api/auth/callback/google
   https://YOUR_PRODUCTION_DOMAIN/api/auth/callback/google
   ```

   Replace the production host with the domain in `NEXT_PUBLIC_APP_URL`. Add a Preview callback only if that hostname is stable and registered. Localhost may use HTTP; deployed callbacks must use HTTPS. The callback must match exactly, including scheme, host, port and path. **Authorized JavaScript origins** are for browser-side Google API/Identity Services integrations and are not needed by this server-side Better Auth flow.

7. **Create separate clients for separate environments when practical.** A single client can list several exact callback URIs, but separate Local/Preview/Production clients make it easier to isolate credentials. Never use wildcard hosts or copy a client secret into browser code.
8. **Save the credentials.** After creating the client, copy its Client ID and Client secret immediately. Google may show the full secret only at creation; if it is lost, create or rotate a secret in the Cloud Console. Put the local values in the ignored `.env`:

   ```dotenv
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

   In Vercel, add both variables under **Project → Settings → Environment Variables**, selecting only the relevant environment, then redeploy.

9. **Test the callback.** Start the app locally at `http://localhost:3000`, open sign-in and complete Google sign-in. Test again on the registered HTTPS deployment. If the app is still in Testing and Google shows a test-user restriction, confirm the account is listed under **Audience → Test users**. Before public launch, use **Publish app** to move to production and follow any task shown in **Verification Center**; verification depends on the app's branding and requested scopes.

The `GOOGLE_CLIENT_ID` identifies the OAuth client and is not a password. `GOOGLE_CLIENT_SECRET` is a server-only secret: do not commit it, add it to a `NEXT_PUBLIC_*` variable, or paste it into an AI prompt. See Google's current [Google Auth Platform setup](https://support.google.com/cloud/answer/15544987?hl=en), [web client and branding guide](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [audience and Testing status guide](https://support.google.com/cloud/answer/15549945?hl=en), [OAuth client guide](https://support.google.com/cloud/answer/15549257?hl=en) and [verification guide](https://support.google.com/cloud/answer/13461325?hl=en).

### OAuth environment variables

| Variable                                    | Required when                  | Where it comes from and how to set it                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GOOGLE_CLIENT_ID`                          | `google` is selected in `auth` | Copy the Client ID from the web client under **Google Auth Platform → Clients**. It identifies the OAuth client and may be visible to the browser.                                                                                                                                                                                                                                                                                                                             |
| `GOOGLE_CLIENT_SECRET`                      | `google` is selected in `auth` | Copy the secret shown when the web client is created and store it in local `.env` or Vercel's sensitive environment variables. It is used only by the server; rotate it if it is lost or exposed.                                                                                                                                                                                                                                                                              |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | `github` is selected in `auth` | On GitHub, open **Settings → Developer settings → OAuth Apps → New OAuth App**. Set the Homepage URL to your app origin and Authorization callback URL to `https://YOUR_DOMAIN/api/auth/callback/github`. Create another app for localhost or another host. Generate its client secret, then put the matching values in local `.env` or Vercel. See GitHub's [OAuth App creation guide](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app). |

OAuth origins and callback URLs must match exactly, including scheme and host. Do not add a Preview callback unless that Preview hostname is stable and registered with the provider.

## Optional analytics

Analytics are disabled by default. Enabling an environment variable does not enable analytics by itself: first set the matching feature flag in `starter.config.json`, then rebuild. These integrations are only rendered on the configured public marketing routes and still depend on your consent policy.

| Variable                   | Where it comes from and how to set it                                                                                                                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_POSTHOG_KEY`  | Optional. Create or select a PostHog project and copy its project/write key from that project's settings. This is a browser ingestion key, not a personal API secret, but use only the public project key. Set `starter.config.json` → `analytics.posthog` to `true`.        |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional when PostHog is enabled. Set the host for the region where the project was created (the example defaults to `https://eu.i.posthog.com`; use the matching US host or your own deployment host if appropriate). Do not put an API key or project token in this field. |

The project key and region are shown in [PostHog project settings](https://posthog.com/docs/settings/projects). Vercel Analytics and Speed Insights have no `.env` variables: enable their separate flags in `starter.config.json` and enable the services for the Vercel project if you want them. All analytics are optional.

## Local Docker values

The interactive setup wizard generates these values only for its local Postgres container. Do not add them to Vercel.

| Variable                  | How it is created                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LOCAL_POSTGRES_PASSWORD` | A random password generated by the wizard for local Docker Postgres. Leave it in the ignored local `.env`; do not reuse it for a hosted database. |
| `POSTGRES_PORT`           | The loopback port selected by the wizard, starting at 54329 and moving upward if occupied. The generated `DATABASE_URL` uses this port.           |
| `COMPOSE_PROJECT_NAME`    | A normalized project name plus a short hash so local Compose resources do not collide with another checkout. Let the wizard manage it.            |

If the wizard uses an existing Postgres database, it does not generate the Docker password, port, or Compose project name.

## Vercel-managed values

Vercel can inject system values into a deployment. They are not entries you should copy from `.env.example`:

- `VERCEL_PROJECT_PRODUCTION_URL` is supplied by Vercel when its system variables are exposed. This app uses it only to infer the canonical URL in credential-free demo mode. For a full app, set `NEXT_PUBLIC_APP_URL` explicitly.
- `VERCEL_OIDC_TOKEN` may be issued by Vercel when Secure Backend Access / OIDC federation is enabled. Do not create it yourself, copy it into Git, or paste it into support requests. This starter does not need it for normal operation.
- `NODE_ENV`, `VERCEL_ENV`, and other platform values are runtime/build metadata, not application configuration to hand-enter here.

## Verify configuration

From the project root, run:

```sh
pnpm env:check
pnpm typecheck
```

`pnpm env:check` checks selected settings, missing values, URL shape, and duplicate/unknown entries in `.env`; it does **not** prove that a database, OAuth provider, email service, or Creem account is reachable. For billing, also run `pnpm billing:catalog`. Test a verification email, each selected OAuth provider, checkout, the webhook delivery, customer portal, renewal/cancel behavior, and the admin event journal in a non-production environment.

If you change `starter.config.json`, `NEXT_PUBLIC_*`, OAuth providers, analytics flags, or demo mode, rebuild and redeploy. If you change a secret or server-only variable, create a fresh deployment so the new value is used.

## Security checklist

- Keep `.env`, `.env.local`, `.vercel/`, database exports, and provider credentials out of Git. `.env.example` is the only environment file intended to be committed.
- Use independent values for Preview and Production, especially databases, auth secrets, Creem keys, webhook secrets, and Resend keys.
- Grant secrets only to the Vercel environments that need them. A value available to Preview code is available to that preview deployment.
- Rotate a credential at its provider if it has been committed, pasted into a public issue, or exposed in a screenshot. Removing it from the latest commit is not enough.
- Never send secrets to an AI assistant. Ask it to edit variable names or check configuration shape while you enter secret values directly in the provider dashboard or local terminal.

## Troubleshooting

| Symptom                                            | Check                                                                                                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OAuth reports `redirect_uri_mismatch`              | The provider callback must exactly match `NEXT_PUBLIC_APP_URL` plus `/api/auth/callback/google` or `/api/auth/callback/github`. Check scheme, domain, port, and provider app. |
| Creem says product/key environment is invalid      | Confirm the key, webhook, product ID, and `CREEM_ENVIRONMENT` all belong to the same Test or Live environment; then run `pnpm billing:catalog`.                               |
| Checkout is disabled                               | Confirm `DEMO_MODE=false`, `BILLING_ENABLED=true`, the selected billing mode has its product IDs, and the latest deployment has those values.                                 |
| A Vercel setting seems unchanged                   | Confirm the variable is attached to the deployment's environment, then deploy again. Existing deployments keep the environment they were built with.                          |
| Password reset or verification email never arrives | Confirm `EMAIL_FROM` uses a verified Resend domain, the key belongs to that Resend project, DNS is verified, and the provider logs show an accepted send.                     |
