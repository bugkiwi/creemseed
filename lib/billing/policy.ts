export type Entitlement = {
  status: string;
  periodEnd: Date | null;
  held: boolean;
  paymentVerified: boolean;
};
export function hasSubscriptionAccess(subscription: Entitlement, now = new Date()) {
  if (
    subscription.held ||
    !subscription.paymentVerified ||
    !subscription.periodEnd ||
    subscription.periodEnd <= now
  )
    return false;
  return ['active', 'trialing', 'scheduled_cancel'].includes(subscription.status);
}
export function isBlockingSubscription(status: string) {
  return !['canceled', 'expired'].includes(status);
}
export function isPendingCheckout(status: string) {
  return ['creating', 'open', 'uncertain'].includes(status);
}
export function isTerminalCheckout(status: string) {
  return ['expired', 'canceled'].includes(status);
}
export function safeBillingUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    !['creem.io', 'www.creem.io', 'checkout.creem.io'].includes(url.hostname)
  )
    throw new Error('Invalid billing URL');
  return url.toString();
}
export function assertBinding(
  actual: { productId: string; userId: string; attemptId: string },
  expected: { productId: string; userId: string; id: string },
) {
  if (
    actual.productId !== expected.productId ||
    actual.userId !== expected.userId ||
    actual.attemptId !== expected.id
  )
    throw new Error('Billing binding mismatch');
}
