# Security policy

Please report suspected vulnerabilities privately through this repository's GitHub **Security → Report a vulnerability** feature, when enabled. Otherwise contact a repository maintainer privately. Do not open a public issue containing credentials, personal data or exploit details.

Only the latest release is maintained. This starter has not received an independent security audit. Local automated checks do not certify a deployed application or payment integration.

## Defaults and boundaries

- No shared credentials, seeded admin or browser endpoint that grants administrator access. `admin:grant` requires an existing verified account, records an audit entry and revokes its sessions. Admin requests read current database roles.
- Better Auth owns password hashing, sessions, email verification, password reset and OAuth. Email/password requires verification. Console email only runs on development localhost; public deployments need transactional email. Account linking is disabled.
- Better Auth uses a database rate limiter. Configure `TRUSTED_PROXY=vercel` only on Vercel, or `x-real-ip` behind a proxy that overwrites that header. With `none`, authentication can use a shared per-path bucket. Add host-level request limits and bot controls for exposed auth endpoints. Do not trust arbitrary forwarded headers.
- Browser billing mutations check Origin, session, verified email, strict request schemas and per-account database rate limits. Billing customer IDs are server-derived. Caller-supplied subscription IDs are checked against ownership.
- HMAC-SHA256 verifies the bounded raw webhook body using constant-time comparison. Creem signatures have no independent delivery timestamp; the durable event ledger and canonical API retrieval provide replay resistance. Event ID collisions with changed bodies fail closed.
- Checkout intents survive process failure. Ambiguous provider failures stay `uncertain` until reconciliation. A checkout success URL never grants access. Reconciliation verifies mode, account, intent, product, customer and transaction references.
- Subscription authorization requires verified payment, an allowed status, a future period end and no hold. Cancellation is explicitly scheduled. Refunded/disputed payments hold subscription access or revoke one-time purchases. Holds are conservative and require an operator review; they are not automatically cleared by later renewal events.
- Webhook payloads are not retained. The journal stores IDs, event type, body hash and processing metadata. Audit entries contain action references, not raw requests. Restrict database access, backups and retention in your deployment.
- Analysis SDKs are opt-in, gated by consent, scoped to allowlisted public routes and have query strings removed. Session replay and autocapture are disabled. SDK dependencies are installed for convenience but are not loaded while disabled.
- Private pages send noindex/no-store headers. This is additional hygiene; session authorization is the actual boundary.
- Local Docker binds Postgres to 127.0.0.1 and uses a generated password. Do not expose this database to a public network.

## Before publishing a fork

1. Inspect `git status`, staged diff and `pnpm security:check`. Use a dedicated secret scanner such as Gitleaks as well; the included scanner is a small guard, not a complete detector.
2. Keep `.env*`, private keys, production data, local dumps and build output out of commits, images and prompt transcripts. `.env.example` only contains empty values or obvious placeholders. The CLI copies an explicit source allowlist.
3. Use distinct test/live Creem settings and databases. Validate products before enabling billing. Rotate secrets if they ever entered Git history; deleting the latest file is insufficient.
4. Review production policy pages, email domain setup, backup/restore and retention. Add app-specific authorization, abuse controls and a Content Security Policy suited to your selected providers.
5. Complete docs/release-checklist.md against your own test-mode account. A signed simulator event is not a real subscription payment.

The dependency audit and scanner in CI are defense layers. They do not replace application review or provider account validation.
