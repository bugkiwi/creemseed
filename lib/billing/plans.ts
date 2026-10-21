import { site } from '@/lib/config';

export const plans = [
  {
    key: 'pro-monthly',
    name: 'Pro',
    label: 'Monthly',
    amount: 990,
    currency: 'USD',
    interval: 'every-month',
    trialDays: 7,
    productEnv: 'CREEM_PRODUCT_PRO_MONTHLY',
    features: ['7-day free trial', 'Full workspace access', 'Manage billing anytime'],
  },
  {
    key: 'pro-yearly',
    name: 'Pro',
    label: 'Yearly',
    amount: 9900,
    currency: 'USD',
    interval: 'every-year',
    trialDays: 7,
    productEnv: 'CREEM_PRODUCT_PRO_YEARLY',
    features: ['7-day free trial', 'Full workspace access', 'Manage billing anytime'],
  },
  {
    key: 'lifetime',
    name: 'Lifetime',
    label: 'One payment',
    amount: 29900,
    currency: 'USD',
    interval: 'once',
    trialDays: 0,
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
    minimumFractionDigits: amount % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}
