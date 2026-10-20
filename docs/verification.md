# Verification record

Date: 2026-10-20. Local macOS development, a dedicated loopback Postgres database, and Linux Node 22 container packaging. No production credentials were imported.

## Completed checks

| Check                                 | Result                                                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locked dependency installation        | Passed with the pinned pnpm version                                                                                                                                                               |
| Drizzle migrations                    | Applied successfully on fresh isolated databases and repeated idempotently                                                                                                                        |
| Full create CLI                       | Passed: copied into a new temporary directory, installed locked dependencies, generated independent local secrets, started an independent Docker database, migrated, then cleaned up that fixture |
| Setup preservation                    | Existing `.env` preserved; nonempty destination refused; non-interactive setup without explicit choices refused                                                                                   |
| TypeScript / production Next.js build | Passed                                                                                                                                                                                            |
| Regression suite                      | 21 tests passed, 0 failures, 0 skipped with the isolated integration database enabled                                                                                                             |
| Dependency audit                      | 0 known vulnerabilities at the recorded run                                                                                                                                                       |
| Public-file guard                     | Passed; local environment, preview data and build output excluded                                                                                                                                 |
| Gitleaks 8.30.1                       | No leaks in the public source snapshot; binary archive checksum verified before use                                                                                                               |
| Browser flow                          | Local signup → local verification link → workspace → sign-in → explicit fixture admin grant → admin desk                                                                                          |
| Browser/API authorization             | Signed-out private pages redirect; signed-out APIs reject; member admin API returns 403; member admin page redirects; cross-origin billing rejects                                                |
| Mobile layout                         | Home and admin subscription list tested at 390px; document width stayed 390px; sign-out remains available                                                                                         |
| Temporary admin fixture               | Revoked and deleted with its sessions; no seeded administrator remains                                                                                                                            |

Payment cases cover raw-body HMAC validation, invalid redirects, product mismatch, duplicate and concurrent checkout requests, duplicate event effects, cross-account cancellation/portal rejection, scheduled cancellation, past-due access, sticky refund/dispute holds, holds arriving before a subscription snapshot, one-time purchase revocation, uncertain checkout recovery, failed event replay, public role injection, and required email verification.

The isolated suite takes **TEST_DATABASE_URL**, refuses non-loopback hosts and database names outside `creemseed_test` / `creemseed_test_*`, and never uses the application's DATABASE_URL as an implicit test target. Billing uses in-process gateway fixtures. Auth email delivery is injected into the test instance and cannot call the operator's real email/OAuth providers.

To run it yourself, create a dedicated empty loopback test database and set TEST_DATABASE_URL in your local environment before `pnpm test`. Do not paste the connection string into a public issue. Without that variable, the integration suite is intentionally skipped; ordinary unit/setup tests still run. CI supplies an ephemeral service database.

## Container packaging

The default Docker Hub image download was too slow locally. A Node 22 Alpine base was available through the public `mirror.gcr.io/library/node:22-alpine` mirror; the standalone image built successfully using the Dockerfile's `NODE_IMAGE` argument. Local environment files and credentials were excluded from the build context. The final runtime smoke check passed: homepage HTTP 200, unauthenticated admin HTTP 307 to /sign-in, runtime user app (non-root), and no /app/.env file. The temporary runtime container was stopped after the check.

## GitHub and Vercel follow-up · 2026-10-20

- Upstream published at [bugkiwi/creemseed](https://github.com/bugkiwi/creemseed), with GitHub template generation and private vulnerability reporting enabled.
- Public production demo deployed at [creemseed.vercel.app](https://creemseed.vercel.app), using the dedicated `creemseed` Vercel project and connected GitHub repository. No customer database or provider credentials were configured; the five project variables are public deployment flags/origin settings.
- Local production build, formatting, type checking and all 21 regression tests passed, including the opt-in isolated Postgres suite and new demo-mode API guards. The credential-free production build also succeeded on Vercel using Node.js 24.
- Actual Vercel upload inputs were inspected: local environment files, `.local` content, dependencies, build output and `.vercel` project files were excluded. Gitleaks found no leaks in the staged change.
- Unauthenticated HTTPS checks confirmed homepage, pricing, sign-in explanation, robots and sitemap return 200; admin and dashboard return 307 to sign-in with noindex headers. Auth session/signup, checkout, admin mutation and Creem webhook routes return the documented 503 demo response.
- Browser inspection confirmed the demo disclosure, upstream template/deployment links and absence of credential inputs. This verifies public demonstration behavior, not real payment processing.

## External verification still required

- A real Creem test checkout, renewal, cancellation and refund/dispute lifecycle against your own account. Gateway fixtures are not real payments.
- Real OAuth provider callbacks and external email delivery, including sender-domain setup.
- Enabled PostHog/Vercel Analytics/Speed Insights network behavior under your deployment and consent policy. These services were disabled in the local preview.
- A GitHub-hosted CI run for the latest commit, and a full application deployment with your own database, email/OAuth and billing accounts. The public Vercel demo does not exercise those integrations.
- Product-specific policies, abuse controls, monitoring, backup/restore, retention and any required independent security review.

Keep provider-backed release evidence private and complete docs/release-checklist.md before accepting real payments.
