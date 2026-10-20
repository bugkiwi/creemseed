import { site } from '@/lib/config';

export const plans = [
  {
    key: 'pro-monthly',
    name: 'Pro',
    label: 'Monthly',
    amount: 1900,
    currency: 'USD',
    interval: 'every-month',
    productEnv: 'CREEM_PRODUCT_PRO_MONTHLY',
    features: ['Full workspace access', 'Manage billing anytime', 'Monthly renewal'],
  },
  {
    key: 'pro-yearly',
    name: 'Pro',
    label: 'Yearly',
    amount: 19000,
    currency: 'USD',
    interval: 'every-year',
    productEnv: 'CREEM_PRODUCT_PRO_YEARLY',
    features: ['Full workspace access', 'Manage billing anytime', 'Annual renewal'],
  },
  {
    key: 'lifetime',
    name: 'Lifetime',
    label: 'One payment',
    amount: 29900,
    currency: 'USD',
    interval: 'once',
    productEnv: 'CREEM_PRODUCT_LIFETIME',
    features: ['Full workspace access', 'No recurring charges', 'One-time purchase'],
  },
] as const;
export type Plan = (typeof plans)[number];
export function enabledPlans(): readonly Plan[] {
  return plans.filter(
    (plan) =>
      site.billing === 'hybrid' ||
      (site.billing === 'onetime' ? plan.interval === 'once' : plan.interval !== 'once'),
  );
}
export function findPlan(key: string) {
  return enabledPlans().find((plan) => plan.key === key);
}
export function planByProduct(id: string) {
  // Keep existing subscriptions recognizable if new checkout for a plan is disabled.
  return plans.find((plan) => process.env[plan.productEnv] === id);
}
export function money(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}
