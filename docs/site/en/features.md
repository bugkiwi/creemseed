# Features

Creemseed is a compact, full-stack starting point for an individual-account SaaS or paid web application. The defaults are examples that you should adapt to your product before taking payments.

## Application foundation

- Next.js App Router, React, TypeScript and Tailwind CSS 4, with reusable UI primitives.
- PostgreSQL persistence with Drizzle ORM and committed, versioned migrations.
- English-first public pages and account screens, a pricing page, authenticated customer dashboard and protected admin area.
- Vercel deployment and standalone Node/Docker output.

## Accounts and authentication

- Better Auth email/password registration and sign-in, email verification, password reset and session handling.
- Optional Google and GitHub sign-in, selected explicitly in `starter.config.json`.
- Per-account billing ownership and server-side authorization for customer and admin operations.
- Administrator registration is not public. An existing verified account must be granted the admin role using the documented command.

## Creem billing

- Recurring monthly and yearly subscriptions through Creem hosted checkout.
- The sample subscription catalog is USD $9.90/month and $99/year with a seven-day trial. The server checks the remote product configuration before creating checkout.
- Optional one-time products, including a one-time product in `hybrid` and `onetime` modes.
- Customer portal links, renewal state, period-end cancellation and server-side access checks.
- Signed webhook validation, persistent event deduplication, account-level serialization and canonical provider reconciliation.
- Uncertain checkout recovery and an admin billing desk for customers, subscriptions, checkout attempts, webhook history, reconciliation, safe replay and audit records.

The included prices and trial are configuration examples. Configure matching products in your own Creem Test environment first. Test and Live credentials, products and webhook endpoints must stay separate.

## Operations and integrations

- A setup CLI that asks about project identity, database, login providers, mail, billing, analytics and deployment.
- An AI installation prompt that asks the same scenario questions and invokes the same validated setup script.
- Resend as an optional transactional email provider; console output is suitable only for local development.
- PostHog, Vercel Analytics and Speed Insights are optional and disabled by default. Analytics require consent and are limited to configured public pages.
- Environment validation and a read-only Creem catalog check.

## Explicit scope

This starter does not ship teams, seats, metered billing, usage credits, a job queue, or a promise of production readiness for any provider account. OAuth, email delivery, Creem checkout/webhooks and hosting still need to be configured and tested in your own environments.

Continue with [manual installation](/docs/manual-install), [AI installation](/docs/ai-install), or the [Creem setup guide](/docs/creem).
