# Release checklist

These steps require your accounts and credentials. Check them against a dedicated test-mode deployment and database before enabling live payments. A passing mock suite does not complete this checklist.

## Identity and deployment

- [ ] Production origin is HTTPS and fixed; callback origins are exact.
- [ ] Fresh runtime secrets; test/preview/live databases and provider secrets separated.
- [ ] Real email verification and reset delivered through your sender domain.
- [ ] Selected Google/GitHub sign-in succeeds; unselected providers stay unavailable.
- [ ] Unverified and signed-out users cannot mutate billing or read admin data.
- [ ] Member cannot promote role, use admin APIs, or access another account's subscription/customer.
- [ ] Admin grant/revoke invalidates sessions; revoked admins immediately lose API/page access.
- [ ] Trusted proxy behavior, edge auth limits, backups/restore and monitoring reviewed.
- [ ] Policy/contact pages replaced; actual cancellation/renewal/refund disclosure reviewed.

## Real Creem test-mode lifecycle

- [ ] Catalog check matches monthly/yearly products, currency, price and tax mode.
- [ ] New checkout → payment → signed webhook → correct customer → paid access.
- [ ] Return URL without payment cannot grant access.
- [ ] Renewal advances the paid-through date and verifies the new invoice.
- [ ] Period-end cancellation retains access through the paid period, then revokes it.
- [ ] Past-due, unpaid, pause, expiry and immediate merchant cancellation revoke access.
- [ ] Customer portal shows only the current account's billing data and payment management.
- [ ] Repeated/concurrent checkout clicks do not create overlapping local attempts.
- [ ] Simulated lost checkout response stays blocked until real canonical reconciliation.
- [ ] Duplicate, delayed and out-of-order webhooks converge without duplicate effects.
- [ ] Failed processing remains retryable; admin replay and manual reconciliation work.
- [ ] Refund/partial refund/dispute holds are applied and later paid events do not silently clear them.
- [ ] If hybrid/onetime is selected, real one-time checkout and refund revoke that purchase correctly.
- [ ] Unmapped products and malformed provider objects fail closed.
- [ ] Logs, error responses, analytics and audit entries contain no credentials or payment payloads.

## Public repository and analytics

- [ ] Inspect staged diff, LICENSE/NOTICE, tracked files and Git remotes/history.
- [ ] Run typecheck, tests, production build, security guard and dependency audit.
- [ ] Run a dedicated secret scanner on all history that will be published.
- [ ] Disabled analytics make no analytics requests; rejection and browser opt-out work.
- [ ] Consent opt-in enables only selected SDKs on public routes; private URLs and query strings stay out.
- [ ] Confirm runtime timeout limits and operational recovery after finite webhook retries.

Record actual results, date, account environment and unresolved failures locally without storing secrets or customer data. Only then enable your live products and `BILLING_ENABLED=true` in production.
