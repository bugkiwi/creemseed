import 'server-only';
import { z } from 'zod';
import { requiredEnv } from '@/lib/config';
import type { Plan } from './plans';

export const ref = (prefix: string) => z.string().regex(new RegExp(`^${prefix}_[a-zA-Z0-9]+$`));
const cents = z.number().int().nonnegative().safe();
const reference = z.union([z.string(), z.object({ id: z.string() }).passthrough()]);
export const remoteId = (value: z.infer<typeof reference>) =>
  typeof value === 'string' ? value : value.id;
export const productSchema = z.object({
  id: ref('prod'),
  mode: z.string(),
  status: z.string(),
  price: cents,
  currency: z.string(),
  billing_type: z.string(),
  billing_period: z.string().nullable(),
  tax_mode: z.string(),
  trial_period_days: z.number().nullable().optional(),
  pay_what_you_want: z.boolean().optional(),
  business_net_pricing: z.boolean().optional(),
  usage_prices: z.array(z.unknown()).optional(),
});
export const subscriptionSchema = z.object({
  id: ref('sub'),
  mode: z.string(),
  product: reference,
  customer: reference,
  status: z.string(),
  current_period_start_date: z.string().nullable().optional(),
  current_period_end_date: z.string().nullable().optional(),
  last_transaction_id: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export const checkoutSchema = z.object({
  id: ref('ch'),
  mode: z.string(),
  product: reference,
  customer: reference.nullable().optional(),
  status: z.string(),
  metadata: z.record(z.unknown()).optional(),
  units: z.number().optional(),
  checkout_url: z.string().optional(),
  custom_price: z.number().optional(),
  subscription: reference.nullable().optional(),
  order: z
    .object({
      id: ref('ord'),
      status: z.string(),
      product: z.string(),
      customer: z.string().optional(),
      transaction: z.string().nullable().optional(),
      currency: z.string(),
      amount_paid: cents.nullable().optional(),
      type: z.string(),
    })
    .nullable()
    .optional(),
});
export const transactionSchema = z.object({
  id: ref('tran'),
  mode: z.string(),
  type: z.string(),
  status: z.string(),
  amount: cents,
  amount_paid: cents.nullable().optional(),
  currency: z.string(),
  customer: z.string().nullable().optional(),
  subscription: z.string().nullable().optional(),
  order: z.string().nullable().optional(),
  refunded_amount: cents.nullable().optional(),
});
export function environment() {
  const mode = process.env.CREEM_ENVIRONMENT || 'test';
  if (mode !== 'test' && mode !== 'live') throw new Error('Invalid Creem environment');
  const key = process.env.CREEM_API_KEY;
  if (key && (!key.startsWith('creem_') || key.startsWith('creem_test_') !== (mode === 'test')))
    throw new Error('Creem key/environment mismatch');
  return mode;
}
export function assertMode(mode: string) {
  if (mode !== (environment() === 'test' ? 'test' : 'prod'))
    throw new Error('Creem object/environment mismatch');
}
export class CreemError extends Error {
  constructor(public status: number) {
    super('Billing provider request failed');
  }
}
export async function creemRequest(path: string, method = 'GET', body?: unknown): Promise<unknown> {
  const base = environment() === 'test' ? 'https://test-api.creem.io' : 'https://api.creem.io';
  const result = await fetch(base + path, {
    method,
    headers: { 'x-api-key': requiredEnv('CREEM_API_KEY'), 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  // No automatic POST retries: a request reference is not an assumed idempotency guarantee.
  if (!result.ok) throw new CreemError(result.status);
  return result.json();
}
export const gateway = {
  product: async (id: string) =>
    productSchema.parse(await creemRequest(`/v1/products/${encodeURIComponent(id)}`)),
  subscription: async (id: string) =>
    subscriptionSchema.parse(
      await creemRequest(`/v1/subscriptions?subscription_id=${encodeURIComponent(id)}`),
    ),
  checkout: async (id: string) =>
    checkoutSchema.parse(await creemRequest(`/v1/checkouts?checkout_id=${encodeURIComponent(id)}`)),
  transaction: async (id: string) =>
    transactionSchema.parse(
      await creemRequest(`/v1/transactions?transaction_id=${encodeURIComponent(id)}`),
    ),
  createCheckout: async (input: unknown) =>
    checkoutSchema.parse(await creemRequest('/v1/checkouts', 'POST', input)),
  portal: async (customerId: string) =>
    z
      .object({ customer_portal_link: z.string().url() })
      .parse(await creemRequest('/v1/customers/billing', 'POST', { customer_id: customerId })),
  cancel: async (id: string) =>
    subscriptionSchema.parse(
      await creemRequest(`/v1/subscriptions/${encodeURIComponent(id)}/cancel`, 'POST', {
        mode: 'scheduled',
        onExecute: 'cancel',
      }),
    ),
};
export type Gateway = typeof gateway;
export function assertProduct(product: z.infer<typeof productSchema>, plan: Plan) {
  assertMode(product.mode);
  if (
    product.status !== 'active' ||
    product.id !== process.env[plan.productEnv] ||
    product.price !== plan.amount ||
    product.currency !== plan.currency ||
    product.billing_type !== (plan.interval === 'once' ? 'onetime' : 'recurring') ||
    product.billing_period !== plan.interval ||
    product.tax_mode !== 'inclusive' ||
    product.trial_period_days ||
    product.pay_what_you_want ||
    product.business_net_pricing ||
    product.usage_prices?.length
  ) {
    throw new Error('Creem product does not match the server catalog');
  }
}
