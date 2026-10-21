import { requireUser } from '@/lib/auth/session';
import { billingState } from '@/lib/billing/service';
import { hasSubscriptionAccess } from '@/lib/billing/policy';
import { Pricing } from '@/components/pricing';
import { BillingAction } from '@/components/billing-actions';
import { money } from '@/lib/billing/plans';
import { Button } from '@/components/ui/button';
import { safeBillingUrl } from '@/lib/billing/policy';

export default async function Billing({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser(true),
    state = await billingState(user.id),
    params = await searchParams;
  const openCheckout = state.attempts.find((a) => a.status === 'open' && a.checkoutUrl);
  return (
    <>
      <p className="eyebrow">YOUR PLAN, YOUR PACE</p>
      <h1>Billing</h1>
      <p className="lede">Subscriptions, payments and the details in between.</p>
      {params.checkout ? (
        <p className="notice" role="status">
          You have returned from checkout. Access updates after Creem confirms your trial or
          payment. Use “Refresh billing” if your plan has not appeared yet.
        </p>
      ) : null}
      <div className="button-row page-actions">
        {openCheckout ? (
          <Button asChild variant="outline">
            <a href={safeBillingUrl(openCheckout.checkoutUrl!)}>Continue existing checkout ↗</a>
          </Button>
        ) : null}
        {state.customer ? (
          <BillingAction action="billing/portal" variant="outline">
            Open billing portal ↗
          </BillingAction>
        ) : null}
        <BillingAction action="billing/reconcile" variant="ghost">
          Refresh billing
        </BillingAction>
      </div>
      {state.attempts.some((a) => ['creating', 'uncertain'].includes(a.status)) ? (
        <p className="notice">
          A checkout is awaiting confirmation. Contact support if it remains unresolved. Avoid
          starting another payment.
        </p>
      ) : null}
      {state.subscriptions.map((sub) => (
        <section className="billing-row" key={sub.id}>
          <div>
            <p className="eyebrow">{sub.planKey}</p>
            <h2>{sub.status.replaceAll('_', ' ')}</h2>
            <p className="muted">
              {sub.periodEnd
                ? `${sub.status === 'trialing' ? 'Trial ends' : sub.cancelAtPeriodEnd ? 'Ends' : 'Current period ends'} ${sub.periodEnd.toLocaleDateString('en-US', { timeZone: 'UTC' })}`
                : 'Waiting for a verified billing period'}
            </p>
            <span className={`badge ${hasSubscriptionAccess(sub) ? 'badge-success' : ''}`}>
              {sub.held
                ? 'Payment review required'
                : hasSubscriptionAccess(sub)
                  ? sub.status === 'trialing'
                    ? 'Trial access active'
                    : 'Access active'
                  : 'Access inactive'}
            </span>
          </div>
          {!['canceled', 'expired', 'scheduled_cancel'].includes(sub.status) ? (
            <BillingAction
              action="billing/cancel"
              body={{ id: sub.id }}
              variant="outline"
              confirmText="Schedule cancellation at the end of your current billing period?"
            >
              Cancel at period end
            </BillingAction>
          ) : null}
        </section>
      ))}
      {state.purchases.map((p) => (
        <section className="billing-row" key={p.id}>
          <div>
            <p className="eyebrow">ONE-TIME PURCHASE</p>
            <h2>{p.planKey}</h2>
            <p>
              {money(p.amountPaid, p.currency)} · {p.status}
            </p>
          </div>
        </section>
      ))}
      {!state.hasAccess &&
      !state.subscriptions.some((s) => !['canceled', 'expired'].includes(s.status)) ? (
        <Pricing />
      ) : null}
    </>
  );
}
