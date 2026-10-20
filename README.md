# Creemseed

**Start small. Build something worth paying for.**

An English-first, MIT-licensed Next.js starter for products paid through Creem, with Better Auth, Postgres, a customer workspace and an admin desk.

[Live demo](https://creemseed.vercel.app) · [Use this template](https://github.com/bugkiwi/creemseed/generate) · [GitHub](https://github.com/bugkiwi/creemseed)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbugkiwi%2Fcreemseed&project-name=creemseed&repository-name=creemseed&env=DEMO_MODE%2CBILLING_ENABLED&envDefaults=%7B%22DEMO_MODE%22%3A%22true%22%2C%22BILLING_ENABLED%22%3A%22false%22%7D&envDescription=Public+demo+only.+Accounts%2C+billing%2C+and+webhooks+are+disabled.+Follow+the+deployment+guide+to+enable+your+own+application.&envLink=https%3A%2F%2Fgithub.com%2Fbugkiwi%2Fcreemseed%2Fblob%2Fmain%2Fdocs%2Fdeployment.md)

[简体中文](./README.zh-CN.md) · [Architecture](./docs/architecture.md) · [Billing](./docs/billing.md) · [Security](./SECURITY.md) · [AI setup prompt](./prompts/setup.md)

## What you get

- **Next.js App Router**, React, TypeScript, Tailwind 4 and shadcn-compatible UI primitives.
- **Better Auth**: email/password, verified email, password reset, optional Google/GitHub login and server-authorized admin roles.
- **Creem subscriptions first**: monthly/yearly plans, hosted checkout, customer portal, renewals, period-end cancellation and server-side access checks. Optional one-time purchases or a mixed catalog.
- **Admin desk**: paginated customers, subscriptions, checkout recovery, webhook journal, safe event replay, canonical reconciliation and audit logs.
- **Postgres + Drizzle**: committed migrations, durable webhook deduplication and account-level billing locks.
- **Optional integrations**: Resend, PostHog, Vercel Analytics and Speed Insights. Analytics are off by default; enabled services require consent and exclude private pages.
- **Two setup paths**: an interactive CLI or an AI prompt. Both use the same validated configuration and ask you to choose your use case.
- Standalone Node/Docker output, Vercel support, CI checks, dependency updates and public-repository hygiene.

Personal accounts are the billing unit. Teams, seats, metered billing, trials and a job platform are outside this small starter. The built-in prices are example product configuration, not a service being offered by this repository. This is an independent community starter, not an official Creem product.

## Public demo and Vercel

The [hosted demo](https://creemseed.vercel.app) runs with `DEMO_MODE=true`. It shows the public template pages, accepts no registrations or payments, and requires no database or provider credentials. All authentication, billing, admin mutation and webhook APIs return HTTP 503 in this mode; private pages redirect to the sign-in explanation.

The Deploy button creates **your own copy** and pre-fills only two public settings: `DEMO_MODE=true` and `BILLING_ENABLED=false`. Demo origins can use Vercel’s production-domain metadata automatically. For a complete application, set `DEMO_MODE=false`, choose your scenario locally, configure independent Postgres/auth/email/Creem settings, and follow [the deployment guide](./docs/deployment.md). Rebuild after changing modes.

## Start with the CLI

Prerequisites: **Node.js 22.18+ or 24**, **pnpm 12.4.2**, and Docker if you want local Postgres.

For a new repository, choose [Use this template](https://github.com/bugkiwi/creemseed/generate). To explore locally, clone the published source and run the wizard:

```sh
git clone https://github.com/bugkiwi/creemseed.git
cd creemseed
node scripts/setup.mjs
```

The wizard asks for:

| Choice         | Options                                                             |
| -------------- | ------------------------------------------------------------------- |
| Application    | Name, description and origin                                        |
| Database       | Local Docker Postgres / existing Postgres                           |
| Authentication | Email, Google, GitHub, or the offered combinations                  |
| Email          | Console on development localhost / Resend                           |
| Billing        | Subscriptions / subscriptions + one-time / one-time only            |
| Analytics      | None / any combination of PostHog, Vercel Analytics, Speed Insights |
| Deployment     | Vercel / Node or Docker                                             |

It installs locked dependencies, creates fresh local secrets in ignored `.env`, starts local Postgres and applies migrations. Docker ports are selected from 54329 upward if needed. Existing `.env` files are preserved. An external database URL is entered locally in `.env`, followed by `pnpm db:migrate`; the wizard never asks you to paste secrets into a public configuration.

To create another project from this local template in one command:

```sh
node bin/create.mjs ../my-app
```

Only allowed template files are copied. Credentials, local assets, build output and Git history are excluded. The command refuses a nonempty destination. There is no published npm installer requirement; `npx create-creemseed` is not claimed to be available.

After setup:

```sh
pnpm env:check
pnpm dev
```

Open **http://localhost:3000**. Register and verify your email. In console email mode, open the verification link printed in your local development terminal. For deployed password login, choose Resend and configure its sender domain; console delivery is intentionally unavailable in production.

```sh
pnpm admin:grant --email you@example.com
```

Sign in again, then open `/admin`. The command requires an existing verified account, invalidates its sessions and records the role change. There is no seeded admin or shared password. Use `pnpm admin:revoke --email you@example.com` to revoke the role.

## Start with an AI assistant

Open [prompts/setup.md](./prompts/setup.md) in your coding assistant, or paste:

> Read AGENTS.md and prompts/setup.md in this repository. Ask me the scenario choices before changing configuration. Use the shared setup script to apply my answers. Never ask me to paste credentials into chat, and preserve existing .env files. Keep billing in test mode and disabled until I explicitly configure it locally.

The assistant must ask about the same choices listed above, including less typical cases such as social-only login, an existing database, one-time plus subscriptions, EU PostHog hosting, or self-hosting behind a trusted proxy. It then writes a **public, secret-free** choices file and runs:

```sh
node scripts/setup.mjs --config /absolute/path/to/choices.json --yes
```

See [docs/setup.md](./docs/setup.md) for the schema, unattended installation and recovery. `--yes` requires an explicit config; it does not silently choose a billing or authentication model. Use `--skip-install` or `--skip-db` to defer those steps.

## Connect Creem

1. Create your own **test-mode** Creem products. The default server catalog uses Pro monthly **$19 USD** and yearly **$190 USD**, recurring, tax inclusive, with no trial or usage charges. Hybrid/one-time mode also uses a **$299 USD** one-time product. Edit [lib/billing/plans.ts](./lib/billing/plans.ts) and create matching products if you want different prices.
2. Set `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET` and the selected `CREEM_PRODUCT_*` IDs in your local secret store. Keep `CREEM_ENVIRONMENT=test`.
3. Register `/api/webhooks/creem` in Creem. Subscribe to `checkout.completed`, the documented `subscription.*` lifecycle events, `refund.created` and `dispute.created`. For local forwarding, use the [official Creem CLI](https://docs.creem.io/code/cli) against your test account.
4. Run `pnpm billing:catalog`. Only after the catalog matches, set `BILLING_ENABLED=true` to exercise test checkout.
5. Complete the [release checklist](./docs/release-checklist.md). Switch to separate live products, key, webhook secret and database only when you are ready to accept real payments.

A checkout return never grants access. Verified events reconcile canonical Creem API state. Recurring access requires a verified payment, an allowed status, an unexpired billing period and no hold. Period-end cancellation retains already-paid access; past-due/unpaid/paused/expired/canceled states fail closed. Refunds and disputes hold access conservatively for operator review.

This starter uses Better Auth for identity and a small server-owned Creem integration for billing authorization. It does not expose generic customer/transaction API proxies to browsers. All customer IDs are derived from the signed-in account; subscription IDs are checked for ownership. See [billing design](./docs/billing.md) for concurrency, failure handling and limitations.

## Customize and deploy

- Public identity and feature choices: `starter.config.json`. Never put credentials there.
- Credentials: `.env` locally, deployment secret settings remotely. `.env.example` documents variable names only.
- Product catalog: `lib/billing/plans.ts`. Keep historical product IDs mapped when evolving your catalog.
- Product code: `app/dashboard`. Use `requirePaidUser()` from `lib/billing/access.ts` at every paid server boundary.
- UI: `app/globals.css`, `components/ui`, `components/brand.tsx`, `app/icon.svg`. English is the default interface; the Chinese README does not introduce runtime locale routing.
- Replace `/terms`, `/privacy`, `/refunds` and `/contact` placeholders with your own reviewed policies and contact details before selling.
- Optional analysis SDKs stay unloaded when disabled. When enabled they load only after consent on allowlisted public routes. Query strings, auth pages, account pages and admin pages are excluded; session replay is off.

[Vercel and Docker deployment](./docs/deployment.md) explains runtime secrets, public build settings, database migrations, proxy trust and email/OAuth callbacks. Both deployment targets use Node.js; no worker or media pipeline is included.

## Commands

| Command                                                      | Purpose                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| `node scripts/setup.mjs`                                     | Interactive installation                                      |
| `node bin/create.mjs ../my-app`                              | Create and install a clean project                            |
| `pnpm dev` / `pnpm build` / `pnpm start`                     | Develop, build, serve                                         |
| `pnpm db:generate` / `pnpm db:migrate`                       | Generate/apply Drizzle migrations                             |
| `pnpm db:studio`                                             | Local database browser; keep it private                       |
| `pnpm admin:grant --email …` / `pnpm admin:revoke --email …` | Explicit role management                                      |
| `pnpm billing:catalog`                                       | Read-only provider product validation                         |
| `pnpm env:check`                                             | Configuration shape, duplicates and missing selected settings |
| `pnpm typecheck` / `pnpm test`                               | Types and regression checks                                   |
| `pnpm security:check`                                        | Small secret and public-file guard                            |
| `pnpm audit --audit-level high`                              | Dependency advisories                                         |

## Verification and release status

The repository includes tests for billing policy, raw signatures, setup validation, and an opt-in isolated Postgres integration suite. See [docs/verification.md](./docs/verification.md) for the checks actually run and their limits. No real Creem transaction, external email or live OAuth success is implied by automated fixtures. Run your own provider-backed subscription lifecycle before launch.

## Representative project

<a href="https://dearune.com">
  <img src="https://dearune.com/brand/dearune-mark.png" alt="Dearune" width="64" />
</a>

[Dearune](https://dearune.com)

For publishing your own fork or template, follow [docs/publishing.md](./docs/publishing.md).

## License

MIT. Preserve [LICENSE](./LICENSE) and [NOTICE](./NOTICE). Creem, Better Auth and Vercel are trademarks of their respective owners. Security reports should follow [SECURITY.md](./SECURITY.md).
