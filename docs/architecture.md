# Architecture

Creemseed keeps one application, one database, and a small number of explicit boundaries. The default interface is English. Configuration choices are public; credentials are not.

```text
Next.js Server Components         Better Auth
  public site / workspace          email, OAuth, session
  admin desk                       Drizzle adapter
          │                             │
          └──────── Postgres ────────────┘
                    │
Browser mutation → authorization → local checkout intent → Creem API
Signed webhook   → event journal → user lock → canonical API state → access
```

## Layout

- `app/`: marketing, authentication, customer dashboard, administrator pages and route handlers.
- `components/ui/`: shadcn-compatible primitives; `components/` contains small product-neutral UI units.
- `lib/auth/`: Better Auth setup, request-scoped session loading and role enforcement.
- `lib/billing/`: server catalog, validated REST gateway, subscription policy, durable event processing and access guard.
- `lib/db/`: Drizzle schema, connection and committed migrations.
- `scripts/`: setup, public-repository guard, migrations, explicit admin role assignment, environment/catalog checks.
- `docs/site/{en,zh-CN}/`: bilingual Markdown rendered by the public documentation site; `prompts/setup*.md` is the canonical AI installation prompt rendered directly on its own docs page.
- `docs/`: engineering, billing, deployment and release references for contributors and operators.
- `bin/create.mjs`: allowlisted local template creation; no repository history or local settings copied.
- `starter.config.json`: application identity and feature choices; safe to commit.

## Identity

Better Auth exclusively handles sessions and credentials. An account is identified by its immutable user ID. Roles are additional non-input fields, re-read from the database for admin actions. Registration never promotes a role. CLI role changes invalidate sessions and write an audit record. No legacy JWT/password stack is retained.

Email/password requires verified email. Console email is limited to development localhost. Optional social providers are only configured when selected. Automatic account linking is off; extending it requires an explicit security design.

## Billing

Personal users are the billing owners. Creem customer mappings include environment and are unique per account and remote customer. Checkout intents, subscriptions, one-time purchases, minimal webhook records and admin audit entries have their own tables. There are no team, content, media, AI or background-worker domains in the core.

The integration uses the documented Creem REST API through a small Zod-validated gateway. Better Auth's billing plugin is not mounted. This keeps generic provider operations away from a public browser API and lets the starter enforce account ownership, intent recovery and transaction boundaries consistently. Product IDs, prices, cadence and tax mode come from server configuration.

A database row lock on the owner serializes billing transitions across application instances. A checkout intent commits before the external create request. Webhook effects and their successful journal status commit in one transaction. Failed processing leaves a retryable journal entry; provider errors do not expose raw payloads to users or logs.

There is no assumed cross-system transaction or automatic exactly-once HTTP delivery. Ambiguous provider mutations require reconciliation; external POSTs are not automatically repeated.

## Public showcase

`DEMO_MODE=true` is a server-side deployment guard, independent of presentation or billing flags. It blocks every mutation/API family and avoids session lookup. Demo-specific calls to action link to the upstream template or deployment flow. It does not create a demo admin, bypass an authorization rule, or reuse a customer database. The full application remains the default when this environment flag is absent or false. Rebuild when changing modes so prerendered pages and server runtime agree.

## Analytics and deployment

PostHog, Vercel Analytics and Speed Insights are independently selectable and disabled initially. SDK modules load only after consent on an explicit public-route allowlist. Browser opt-out is honored. No analytics identify users or capture private route query strings. Dependencies are present so enabling a feature is a configuration change; disabled integrations make no runtime analytics requests.

Vercel and standalone Node/Docker use the same Node.js application. Postgres should use a pooled runtime connection on serverless hosts. Apply migrations through the migration script before a release. Deployment selection records intent and informs installation; it does not provision cloud accounts or deploy automatically.

Extend small domain modules as the product grows. Team billing, queues, metering, credit wallets and one-trial-per-person eligibility should each be designed when actually needed. Trial access in the core is bounded by a verified checkout and the canonical seven-day period.
