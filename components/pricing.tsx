import { enabledPlans, money } from '@/lib/billing/plans';
import { BillingAction } from './billing-actions';
import { isDemoMode } from '@/lib/deployment';
import { deployUrl } from '@/lib/project';
import { Button } from './ui/button';

export function Pricing() {
  return (
    <div className="pricing-grid">
      {enabledPlans().map((plan, i) => (
        <article className={`price-panel ${i === 0 ? 'price-featured' : ''}`} key={plan.key}>
          <p className="eyebrow">{plan.label}</p>
          <h2>{plan.name}</h2>
          <p className="price">
            {money(plan.amount)}
            <span>
              {plan.interval === 'once'
                ? ' / once'
                : plan.interval === 'every-year'
                  ? ' / year'
                  : ' / month'}
            </span>
          </p>
          <p className="muted small">USD · Tax included</p>
          <ul>
            {plan.features.map((f) => (
              <li key={f}>
                <span aria-hidden="true">✓</span> {f}
              </li>
            ))}
          </ul>
          {isDemoMode() ? (
            <Button asChild>
              <a href={deployUrl}>Deploy your copy ↗</a>
            </Button>
          ) : (
            <BillingAction action="billing/checkout" body={{ plan: plan.key }}>
              Choose {plan.label.toLowerCase()} <span aria-hidden="true">↗</span>
            </BillingAction>
          )}
        </article>
      ))}
    </div>
  );
}
