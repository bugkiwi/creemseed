import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  assertBinding,
  hasSubscriptionAccess,
  isBlockingSubscription,
  isPendingCheckout,
  safeBillingUrl,
} from '../lib/billing/policy';
import { verifyEvent } from '../lib/billing/signature';
import { assertProduct, environment } from '../lib/billing/creem';
import { plans } from '../lib/billing/plans';

const now = new Date('2026-01-01T00:00:00Z');
const valid = {
  status: 'active',
  held: false,
  paymentVerified: true,
  periodEnd: new Date('2026-02-01T00:00:00Z'),
};
test('paid access is bounded by canonical status, payment, hold and time', () => {
  assert.equal(hasSubscriptionAccess(valid, now), true);
  assert.equal(hasSubscriptionAccess({ ...valid, status: 'scheduled_cancel' }, now), true);
  for (const status of [
    'canceled',
    'expired',
    'past_due',
    'unpaid',
    'paused',
    'pending',
    'unknown',
  ])
    assert.equal(hasSubscriptionAccess({ ...valid, status }, now), false);
  assert.equal(hasSubscriptionAccess({ ...valid, paymentVerified: false }, now), false);
  assert.equal(hasSubscriptionAccess({ ...valid, held: true }, now), false);
  assert.equal(hasSubscriptionAccess({ ...valid, periodEnd: null }, now), false);
  assert.equal(hasSubscriptionAccess({ ...valid, periodEnd: now }, now), false);
  assert.equal(
    hasSubscriptionAccess({ ...valid, status: 'trialing', paymentVerified: false }, now),
    false,
  );
});
test('unresolved billing state blocks a second checkout', () => {
  for (const status of ['active', 'paused', 'past_due', 'unpaid', 'scheduled_cancel', 'unknown'])
    assert.equal(isBlockingSubscription(status), true);
  for (const status of ['canceled', 'expired']) assert.equal(isBlockingSubscription(status), false);
  for (const status of ['creating', 'open', 'uncertain'])
    assert.equal(isPendingCheckout(status), true);
  for (const status of ['failed', 'closed', 'completed'])
    assert.equal(isPendingCheckout(status), false);
});
test('billing redirects reject lookalike hosts, credentials, insecure protocols and ports', () => {
  assert.equal(
    safeBillingUrl('https://www.creem.io/test/checkout'),
    'https://www.creem.io/test/checkout',
  );
  for (const url of [
    'http://creem.io/checkout',
    'https://creem.io.attacker.example/',
    'https://creem.io@attacker.example/',
    'https://user:pass@creem.io/',
    'https://creem.io:8443/',
    'javascript:alert(1)',
  ])
    assert.throws(() => safeBillingUrl(url));
});
test('intent binding requires all three server references', () => {
  const expected = { id: 'intent-1', userId: 'user-1', productId: 'prod_Test' };
  assert.doesNotThrow(() =>
    assertBinding({ attemptId: 'intent-1', userId: 'user-1', productId: 'prod_Test' }, expected),
  );
  for (const field of ['attemptId', 'userId', 'productId'] as const)
    assert.throws(() =>
      assertBinding(
        { attemptId: 'intent-1', userId: 'user-1', productId: 'prod_Test', [field]: 'other' },
        expected,
      ),
    );
});
test('webhook HMAC covers the exact raw bytes; invalid and changed bodies fail', () => {
  const secret = 'fixture-only-'.repeat(4);
  const raw = JSON.stringify({
    id: 'evt_Test',
    eventType: 'checkout.completed',
    object: { id: 'ch_Test' },
  });
  const signature = createHmac('sha256', secret).update(raw).digest('hex');
  assert.equal(verifyEvent(raw, signature, secret).id, 'evt_Test');
  assert.equal(verifyEvent(raw, signature.toUpperCase(), secret).id, 'evt_Test');
  for (const header of [null, '', 'a'.repeat(63), 'z'.repeat(64), 'a'.repeat(64)])
    assert.throws(() => verifyEvent(raw, header, secret));
  assert.throws(() => verifyEvent(raw + ' ', signature, secret));
  assert.throws(() => verifyEvent(raw, signature, ''));
});
test('catalog validation rejects wrong environments, cadence, prices and unsupported trial charges', () => {
  process.env.CREEM_ENVIRONMENT = 'test';
  process.env.CREEM_API_KEY = 'creem_test_' + 'fixture';
  process.env.CREEM_PRODUCT_PRO_MONTHLY = 'prod_TestMonth';
  const product = {
    id: 'prod_TestMonth',
    mode: 'test',
    status: 'active',
    price: 1900,
    currency: 'USD',
    billing_type: 'recurring',
    billing_period: 'every-month',
    tax_mode: 'inclusive',
  };
  assert.doesNotThrow(() => assertProduct(product, plans[0]));
  for (const values of [
    { mode: 'prod' },
    { price: 100 },
    { currency: 'EUR' },
    { billing_type: 'onetime' },
    { billing_period: 'every-year' },
    { tax_mode: 'exclusive' },
    { trial_period_days: 7 },
    { pay_what_you_want: true },
    { usage_prices: [{}] },
  ])
    assert.throws(() => assertProduct({ ...product, ...values }, plans[0]));
  process.env.CREEM_ENVIRONMENT = 'live';
  assert.throws(() => environment());
  process.env.CREEM_ENVIRONMENT = 'test';
});
