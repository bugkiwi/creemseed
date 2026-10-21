# Creem billing setup

Creem is the payment provider integrated by this starter. The recurring catalog is enabled by your server configuration and uses Creem-hosted checkout. Start with Test mode and a separate database; Test credentials and products cannot process real charges.

## Choose a billing model

Set the model through the CLI or `starter.config.json`:

- `subscriptions`: monthly and yearly recurring plans.
- `hybrid`: monthly/yearly subscriptions plus one-time lifetime access.
- `onetime`: one-time lifetime access only.

The default subscription examples are **$9.90 USD monthly** and **$99 USD yearly**, both with a **7-day trial**. `hybrid` and `onetime` use the configured lifetime product. These are example catalog values; edit the server catalog and create matching products in Creem if your pricing differs. The browser never supplies a trusted price.

## 1. Create Test products

1. Sign in to [Creem](https://www.creem.io) and switch to **Test mode**.
2. Create a monthly recurring product and an annual recurring product. Match the amount, USD currency, tax behavior and seven-day trial in `lib/billing/plans.ts`.
3. If using `hybrid` or `onetime`, create a separate one-time product with the configured amount and currency.
4. Copy each product ID into the matching local `.env` value: `CREEM_PRODUCT_PRO_MONTHLY`, `CREEM_PRODUCT_PRO_YEARLY`, and, when selected, `CREEM_PRODUCT_LIFETIME`.

If you edit the catalog, keep the product mapping historically correct; do not point an existing product ID at a different plan after customers have subscribed.

## 2. Add the API key and webhook

In the Creem dashboard, open **Developers → API Keys** and copy the Test API key into `CREEM_API_KEY`. Under **Developers → Webhooks**, create an endpoint:

```text
https://YOUR_APP_DOMAIN/api/webhooks/creem
```

Copy its signing secret to `CREEM_WEBHOOK_SECRET`. Use the subscription lifecycle events listed in [`docs/billing.md`](https://github.com/bugkiwi/creemseed/blob/main/docs/billing.md#webhook-coverage), plus `checkout.completed`, `refund.created` and `dispute.created`. Local development needs a publicly reachable Test webhook endpoint or Creem's supported forwarding tool.

Keep `CREEM_ENVIRONMENT=test` and `BILLING_ENABLED=false` while filling the catalog. Test key, products and webhook signing secret must all belong to Test mode.

## 3. Check the catalog and enable Test billing

From a trusted local shell with the Test values loaded, run:

```sh
pnpm billing:catalog
```

This read-only command checks product identity, environment, currency, price, interval, tax mode, trial length and unsupported usage pricing. Resolve every mismatch before enabling billing. Then set `BILLING_ENABLED=true` for the isolated test deployment and redeploy.

Test the complete lifecycle: create an account, start a trial, receive the signed completion webhook, check trial access, verify a paid renewal after the trial, cancel at period end, and inspect the customer portal and admin event journal. A browser return URL alone never grants access; verified Creem state does.

## Admin billing desk

Administrators can review customers, subscriptions and unresolved checkout attempts; inspect webhook delivery history; reconcile a subscription against Creem's canonical API state; and replay eligible failed events. Admin operations require an authenticated administrator account and are audited. Grant the role only to your own verified account with the documented `pnpm admin:grant` flow; public registration does not create admins.

## Moving to Live

After the Test lifecycle works in your own Vercel or Node deployment, create separate Live products, API key and webhook endpoint. Add them only to the intended Production environment. Confirm `CREEM_ENVIRONMENT=live`, `BILLING_ENABLED=true`, and the matching product IDs in that deployment, then redeploy. Do not reuse Test secrets or database credentials. Follow the [release checklist](https://github.com/bugkiwi/creemseed/blob/main/docs/release-checklist.md) before accepting real payments.

For every variable and storage location, see [environment setup](/docs/environment). For Vercel-specific environment separation, see [Vercel deployment](/docs/vercel).
