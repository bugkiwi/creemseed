# Creem billing

## Catalog

`lib/billing/plans.ts` is authoritative. Clients submit only a plan key. Before checkout, the gateway reads the remote product and checks environment, exact ID, price, currency, billing type, cadence, inclusive tax, exact trial length and absence of usage pricing. The default recurring catalog is $9.90/month or $99/year with a seven-day trial. Configuration is USD by default and can be edited server-side. Discounts can be configured in Creem's hosted checkout; entitlement does not assume the full list price was collected.

Default modes:

| Mode            | Catalog                           |
| --------------- | --------------------------------- |
| `subscriptions` | Pro monthly, Pro yearly           |
| `hybrid`        | Pro monthly, Pro yearly, Lifetime |
| `onetime`       | Lifetime                          |

The seven-day trial is supported for configured recurring products. Custom recurrence, seats and usage charges remain rejected. A merchant who promises one trial per customer must enforce that eligibility separately; this starter does not assume Creem prevents repeated trials. Preserve historical product mapping when changing products or prices. Do not silently reassign an old product ID to a different plan.

## Checkout and recovery

1. Authenticate the verified user, validate Origin and rate-limit the mutation.
2. Validate the selected remote product.
3. Lock the local user row. Block overlapping unresolved checkouts and duplicate active subscriptions or owned lifetime access.
4. Commit a `creating` intent with random ID, owner, product, environment and plan.
5. Make one Creem checkout POST with that intent and owner in server-supplied metadata. `request_id` is a correlation reference; the application does not depend on undocumented retry guarantees.
6. Persist a safe hosted URL and checkout ID. An existing matching open checkout is reused. A timeout, crash or ambiguous response blocks another create request until reconciliation.
7. A verified completion reconciles the remote checkout, intent, owner, mode, units, product and customer. Paid checkouts also require matching order and transaction. Trial checkouts require a matching canonical trialing subscription with a valid period. Only then map the customer and synchronize access.

A lost POST response may have no local remote ID. The operator finds the checkout in the merchant dashboard using the local attempt reference, then supplies `ch_…` under **Admin → Checkouts**. The recovery action verifies all bindings. Open remote checkouts stay open; canonical canceled/expired checkouts close the local attempt. It never guesses that a charge failed or creates another charge. If the provider never received the request and no checkout exists, support must investigate before a reviewed manual recovery; the starter has no unsafe force-reset button.

The browser success page is informational. It cannot activate a subscription or complete a purchase.

## Subscription lifecycle and access

The local snapshot is always read from the API under the user's lock. A stale webhook is therefore a request to fetch current state, rather than a historical instruction to restore access. A payment transaction must match the customer, subscription, currency, mode and invoice type. The policy additionally requires a future `current_period_end_date`.

| Status                         | Paid access                                                           |
| ------------------------------ | --------------------------------------------------------------------- |
| `active`                       | Yes, with verified payment and future period end                      |
| `scheduled_cancel`             | Yes until period end, with verified payment                           |
| `trialing`                     | Yes, only after verified checkout and until the stored trial deadline |
| `past_due`, `unpaid`, `paused` | No; customer can open portal to resolve billing                       |
| `canceled`, `expired`, unknown | No                                                                    |
| Any status on payment hold     | No                                                                    |

A period expiring revokes access even when no expiry event arrives. A trial deadline is stored only after a completed account-bound checkout and canonical Creem trialing state; it cannot extend into a later paid period without a verified payment. The helper `requirePaidUser()` enforces this server-side for each paid operation. New recurring checkout is blocked while an existing subscription is active, trialing, scheduled, paused or unresolved, including past-due state. Recover the existing subscription first. Use the merchant dashboard for product changes; only configured products can receive automatic access.

Customers and admins can explicitly request `mode: scheduled`, `onExecute: cancel`; no implicit provider default is trusted. Reconciliation confirms the actual resulting status. The paid-through date is displayed in UTC. Renewal state is obtained from `subscription.paid` and the other lifecycle events; the API's current last payment is verified rather than using event type alone.

## Events and reconciliation

Register `/api/webhooks/creem` for:

```text
checkout.completed
subscription.active
subscription.paid
subscription.update
subscription.canceled
subscription.scheduled_cancel
subscription.past_due
subscription.unpaid
subscription.expired
subscription.trialing
subscription.paused
refund.created
dispute.created
```

The handler verifies HMAC-SHA256 over the bounded raw body, then stores only the event ID, type, object ID, related transaction ID, body hash and processing metadata. It uses the provider ID as the durable deduplication key. A replay of an already-processed event has no further effects. Failed effects roll back; the failure record remains available for retries. Unknown event types are journaled as ignored.

Events can arrive out of order. If a subscription event arrives before checkout establishes its customer mapping, processing fails with a retryable journal state. Creem retries; the operator can also replay it after the completion event maps the customer. No account is linked by unverified webhook email.

The admin desk can reconcile subscriptions without replaying payloads, replay failed or pending events by ID, and inspect uncertain checkouts. Customer refresh reconciles one recent outstanding checkout and one current subscription per request, bounded to keep request work finite. This starter has no cron reconciliation service. Set up operational alerts or a scheduled reconciliation job if your deployment requires automatic recovery beyond provider retries. Check **Admin → Webhooks** regularly.

## Refunds and disputes

Verified refund/dispute references are resolved through the transaction API and matched to the local customer's environment. Refunded or disputed one-time payments revoke that purchase. Subscriptions receive a sticky `held` flag, preventing a later paid or active event from automatically restoring potentially disputed access. Partial refunds also hold conservatively.

There is no browser refund endpoint and no automatic clearance of holds. The operator reviews refunds/disputes in Creem and follows a reviewed recovery process. A future clearance tool should require an explicit reason, canonical evidence and an audit entry. Do not clear holds just because a newer renewal was paid.

## Ownership and environment

- Browser code cannot choose a customer ID, product ID, amount, success URL or checkout metadata.
- Portal customer IDs come exclusively from the session's stored mapping.
- Subscription cancellation/reconciliation verifies the current owner. Admin operations require a verified database admin role and an audit entry.
- Test/live API hosts are fixed and key prefix must match mode. Remote objects must be `test` or `prod` as expected. Use separate databases for the environments.
- No POST automatically retries. Errors and logs never include provider response bodies, customer emails or request tokens.

## Reference contracts

The implementation was checked against the official [checkout](https://docs.creem.io/api-reference/endpoint/create-checkout), [product](https://docs.creem.io/api-reference/endpoint/get-product), [subscription](https://docs.creem.io/api-reference/endpoint/get-subscription), [cancellation](https://docs.creem.io/api-reference/endpoint/cancel-subscription), [customer billing](https://docs.creem.io/api-reference/endpoint/create-customer-billing), [transaction](https://docs.creem.io/api-reference/endpoint/get-transaction) and [webhook](https://docs.creem.io/code/webhooks) documentation. Validate these contracts against your account and installed versions before release.
