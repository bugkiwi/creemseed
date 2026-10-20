import 'server-only';
import { assertAppMode } from '@/lib/deployment';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db, type Transaction } from '@/lib/db';
import {
  auditLogs,
  billingCustomers,
  checkoutAttempts,
  purchases,
  subscriptions,
  paymentHolds,
} from '@/lib/db/schema';
import { appUrl, requiredEnv } from '@/lib/config';
import { HttpError } from '@/lib/http';
import {
  assertMode,
  assertProduct,
  CreemError,
  environment,
  gateway,
  remoteId,
  type Gateway,
} from './creem';
import { findPlan, planByProduct } from './plans';
import {
  assertBinding,
  hasSubscriptionAccess,
  isBlockingSubscription,
  isPendingCheckout,
  isTerminalCheckout,
  safeBillingUrl,
} from './policy';

export async function lockUser(tx: Transaction, id: string) {
  const records = await tx.execute(sql`select id from "user" where id=${id} for update`);
  if (!records.length) throw new Error('Billing user missing');
}
export async function audit(
  actorId: string,
  action: string,
  targetId: string,
  details?: Record<string, string>,
) {
  await db.insert(auditLogs).values({ id: randomUUID(), actorId, action, targetId, details });
}
export function assertBillingEnabled() {
  assertAppMode();
  if (process.env.BILLING_ENABLED !== 'true')
    throw new HttpError(503, 'Billing has not been enabled yet.');
  environment();
  requiredEnv('CREEM_API_KEY');
  requiredEnv('CREEM_WEBHOOK_SECRET');
  if (environment() === 'live' && new URL(appUrl()).protocol !== 'https:')
    throw new HttpError(503, 'Live billing requires HTTPS.');
}
export async function billingState(userId: string) {
  const env = environment();
  const [subs, orders, customers, attempts] = await Promise.all([
    db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.environment, env)))
      .orderBy(desc(subscriptions.syncedAt)),
    db
      .select()
      .from(purchases)
      .where(and(eq(purchases.userId, userId), eq(purchases.environment, env))),
    db
      .select()
      .from(billingCustomers)
      .where(and(eq(billingCustomers.userId, userId), eq(billingCustomers.environment, env))),
    db
      .select()
      .from(checkoutAttempts)
      .where(and(eq(checkoutAttempts.userId, userId), eq(checkoutAttempts.environment, env)))
      .orderBy(desc(checkoutAttempts.createdAt))
      .limit(5),
  ]);
  return {
    subscriptions: subs,
    purchases: orders,
    customer: customers[0],
    attempts,
    hasAccess:
      subs.some((s) => hasSubscriptionAccess(s)) || orders.some((p) => p.status === 'paid'),
  };
}
export async function startCheckout(
  owner: { id: string; email: string },
  planKey: string,
  provider: Gateway = gateway,
) {
  assertBillingEnabled();
  const plan = findPlan(planKey);
  if (!plan) throw new HttpError(400, 'Unknown plan.');
  const productId = requiredEnv(plan.productEnv);
  assertProduct(await provider.product(productId), plan);
  const intent = await db.transaction(async (tx) => {
    await lockUser(tx, owner.id);
    const env = environment();
    const subs = await tx
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, owner.id), eq(subscriptions.environment, env)));
    if (subs.some((s) => isBlockingSubscription(s.status)))
      throw new HttpError(
        409,
        'Manage your existing subscription in the billing portal before starting another purchase.',
      );
    const [owned] = await tx
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.userId, owner.id),
          eq(purchases.environment, env),
          eq(purchases.status, 'paid'),
        ),
      )
      .limit(1);
    if (owned) throw new HttpError(409, 'Your account already has lifetime access.');
    const attempts = await tx
      .select()
      .from(checkoutAttempts)
      .where(and(eq(checkoutAttempts.userId, owner.id), eq(checkoutAttempts.environment, env)));
    const pending = attempts.find((a) => isPendingCheckout(a.status));
    if (pending) {
      if (pending.status === 'open' && pending.planKey === plan.key && pending.checkoutUrl)
        return { ...pending, reused: true };
      throw new HttpError(
        409,
        'An existing checkout needs to finish or be reconciled. Open billing for details.',
      );
    }
    const [created] = await tx
      .insert(checkoutAttempts)
      .values({ id: randomUUID(), userId: owner.id, planKey, productId, environment: env })
      .returning();
    return { ...created, reused: false };
  });
  if (intent.reused) return safeBillingUrl(intent.checkoutUrl!);
  // The intent commits BEFORE the external POST, surviving crashes and timeouts.
  try {
    const [customer] = await db
      .select()
      .from(billingCustomers)
      .where(
        and(eq(billingCustomers.userId, owner.id), eq(billingCustomers.environment, environment())),
      );
    const checkout = await provider.createCheckout({
      product_id: productId,
      units: 1,
      request_id: intent.id,
      customer: customer ? { id: customer.customerId } : { email: owner.email },
      success_url: `${appUrl()}/dashboard/billing?checkout=returned`,
      metadata: { userId: owner.id, attemptId: intent.id },
    });
    assertMode(checkout.mode);
    assertBinding(
      {
        productId: remoteId(checkout.product),
        userId: String(checkout.metadata?.userId),
        attemptId: String(checkout.metadata?.attemptId),
      },
      intent,
    );
    const url = safeBillingUrl(checkout.checkout_url || '');
    await db.transaction(async (tx) => {
      await lockUser(tx, owner.id);
      // A fast webhook can finish this attempt before the POST response arrives.
      await tx
        .update(checkoutAttempts)
        .set({ checkoutId: checkout.id, checkoutUrl: url, status: 'open', updatedAt: new Date() })
        .where(and(eq(checkoutAttempts.id, intent.id), eq(checkoutAttempts.status, 'creating')));
    });
    return url;
  } catch (error) {
    const definiteRejection =
      error instanceof CreemError && [400, 401, 403, 404, 422].includes(error.status);
    await db
      .update(checkoutAttempts)
      .set({ status: definiteRejection ? 'failed' : 'uncertain', updatedAt: new Date() })
      .where(and(eq(checkoutAttempts.id, intent.id), eq(checkoutAttempts.status, 'creating')));
    throw new HttpError(
      502,
      definiteRejection
        ? 'Checkout could not be created. Contact support.'
        : 'Checkout could not be confirmed. Contact support before starting another payment.',
    );
  }
}
async function bindCustomer(tx: Transaction, userId: string, customerId: string) {
  const env = environment();
  const [existing] = await tx
    .select()
    .from(billingCustomers)
    .where(and(eq(billingCustomers.userId, userId), eq(billingCustomers.environment, env)));
  if (existing && existing.customerId !== customerId) throw new Error('Customer mapping mismatch');
  if (!existing)
    await tx
      .insert(billingCustomers)
      .values({ id: randomUUID(), userId, customerId, environment: env });
}
const parsedDate = (value?: string | null) => {
  if (!value) return null;
  const result = new Date(value);
  if (!Number.isFinite(result.getTime())) throw new Error('Invalid billing date');
  return result;
};
export async function syncSubscription(
  tx: Transaction,
  id: string,
  userId: string,
  provider: Gateway = gateway,
) {
  // Callers hold the user's row lock before reading canonical state. This avoids
  // an older concurrent retrieval overwriting a newer subscription snapshot.
  const remote = await provider.subscription(id);
  assertMode(remote.mode);
  const customerId = remoteId(remote.customer),
    productId = remoteId(remote.product);
  const [customer] = await tx
    .select()
    .from(billingCustomers)
    .where(
      and(eq(billingCustomers.userId, userId), eq(billingCustomers.environment, environment())),
    );
  if (!customer || customer.customerId !== customerId)
    throw new Error('Subscription ownership mismatch');
  const [existing] = await tx.select().from(subscriptions).where(eq(subscriptions.id, id));
  if (existing && (existing.userId !== userId || existing.environment !== environment()))
    throw new Error('Subscription binding mismatch');
  const plan = planByProduct(productId);
  let paymentVerified = false;
  const [paymentHold] = await tx
    .select({ id: paymentHolds.id })
    .from(paymentHolds)
    .where(
      and(
        eq(paymentHolds.subscriptionId, id),
        eq(paymentHolds.userId, userId),
        eq(paymentHolds.environment, environment()),
      ),
    )
    .limit(1);
  let held: boolean =
    Boolean(existing?.held) || Boolean(paymentHold) || !plan || plan.interval === 'once';
  if (remote.last_transaction_id && plan) {
    const transaction = await provider.transaction(remote.last_transaction_id);
    assertMode(transaction.mode);
    if (
      transaction.subscription !== id ||
      transaction.customer !== customerId ||
      transaction.type !== 'invoice' ||
      transaction.currency !== plan.currency
    )
      throw new Error('Subscription transaction mismatch');
    held ||=
      ['refunded', 'partialRefund', 'chargedBack'].includes(transaction.status) ||
      !!transaction.refunded_amount;
    paymentVerified = transaction.status === 'paid' && !transaction.refunded_amount;
  }
  // Trials are deliberately absent from the starter catalog. Enabling trials
  // requires a separate eligibility policy; trialing alone never grants access.
  const values = {
    userId,
    customerId,
    productId,
    planKey: plan?.key || 'unmapped',
    environment: environment(),
    status: remote.status,
    periodStart: parsedDate(remote.current_period_start_date),
    periodEnd: parsedDate(remote.current_period_end_date),
    cancelAtPeriodEnd: remote.status === 'scheduled_cancel',
    paymentVerified,
    held,
    syncedAt: new Date(),
  };
  await tx
    .insert(subscriptions)
    .values({ id, ...values })
    .onConflictDoUpdate({ target: subscriptions.id, set: values });
  return values;
}
export async function syncCheckout(
  tx: Transaction,
  checkoutId: string,
  expectedAttemptId?: string,
  provider: Gateway = gateway,
) {
  let remote = await provider.checkout(checkoutId);
  const attemptId = remote.metadata?.attemptId;
  if (typeof attemptId !== 'string' || (expectedAttemptId && attemptId !== expectedAttemptId))
    throw new Error('Checkout intent mismatch');
  const [attempt] = await tx
    .select()
    .from(checkoutAttempts)
    .where(eq(checkoutAttempts.id, attemptId));
  if (!attempt || attempt.environment !== environment()) throw new Error('Unknown checkout intent');
  await lockUser(tx, attempt.userId);
  remote = await provider.checkout(checkoutId);
  assertMode(remote.mode);
  assertBinding(
    {
      productId: remoteId(remote.product),
      userId: String(remote.metadata?.userId),
      attemptId: String(remote.metadata?.attemptId),
    },
    attempt,
  );
  if (
    (attempt.checkoutId && attempt.checkoutId !== checkoutId) ||
    remote.custom_price !== undefined ||
    remote.units !== 1
  )
    throw new Error('Checkout mismatch');
  if (remote.status !== 'completed') {
    if (attempt.status === 'completed') throw new Error('Completed checkout cannot regress');
    await tx
      .update(checkoutAttempts)
      .set({
        checkoutId,
        status: isTerminalCheckout(remote.status) ? 'closed' : 'open',
        checkoutUrl: remote.checkout_url
          ? safeBillingUrl(remote.checkout_url)
          : attempt.checkoutUrl,
        updatedAt: new Date(),
      })
      .where(eq(checkoutAttempts.id, attempt.id));
    return;
  }
  if (
    !remote.customer ||
    !remote.order ||
    remote.order.status !== 'paid' ||
    remote.order.product !== attempt.productId ||
    !remote.order.transaction
  )
    throw new Error('Payment not confirmed');
  const customerId = remoteId(remote.customer);
  const transaction = await provider.transaction(remote.order.transaction);
  assertMode(transaction.mode);
  const plan = planByProduct(attempt.productId);
  if (
    !plan ||
    transaction.customer !== customerId ||
    transaction.order !== remote.order.id ||
    transaction.currency !== plan.currency ||
    remote.order.currency !== plan.currency
  )
    throw new Error('Payment binding mismatch');
  await bindCustomer(tx, attempt.userId, customerId);
  if (plan.interval === 'once') {
    if (
      remote.subscription ||
      transaction.subscription ||
      transaction.type !== 'payment' ||
      remote.order.type !== 'onetime' ||
      transaction.amount_paid == null ||
      transaction.amount_paid !== remote.order.amount_paid
    )
      throw new Error('One-time payment mismatch');
    const [paymentHold] = await tx
      .select({ id: paymentHolds.id })
      .from(paymentHolds)
      .where(
        and(
          eq(paymentHolds.transactionId, transaction.id),
          eq(paymentHolds.environment, environment()),
        ),
      )
      .limit(1);
    const status =
      transaction.status === 'paid' && !transaction.refunded_amount && !paymentHold
        ? 'paid'
        : 'revoked';
    const [existing] = await tx.select().from(purchases).where(eq(purchases.id, remote.order.id));
    if (existing && existing.userId !== attempt.userId)
      throw new Error('Purchase ownership mismatch');
    await tx
      .insert(purchases)
      .values({
        id: remote.order.id,
        userId: attempt.userId,
        customerId,
        productId: attempt.productId,
        planKey: plan.key,
        transactionId: transaction.id,
        environment: environment(),
        status,
        amountPaid: transaction.amount_paid,
        currency: transaction.currency,
      })
      .onConflictDoUpdate({
        target: purchases.id,
        set: { status: existing?.status === 'revoked' ? 'revoked' : status },
      });
  } else {
    if (
      !remote.subscription ||
      remote.order.type !== 'recurring' ||
      transaction.subscription !== remoteId(remote.subscription)
    )
      throw new Error('Subscription checkout mismatch');
    await syncSubscription(tx, remoteId(remote.subscription), attempt.userId, provider);
  }
  await tx
    .update(checkoutAttempts)
    .set({ status: 'completed', checkoutId, updatedAt: new Date() })
    .where(eq(checkoutAttempts.id, attempt.id));
}
export async function reconcileSubscription(
  id: string,
  ownerId?: string,
  provider: Gateway = gateway,
) {
  return db.transaction(async (tx) => {
    const [subscription] = await tx
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.environment, environment())));
    if (!subscription || (ownerId && subscription.userId !== ownerId))
      throw new HttpError(404, 'Subscription not found.');
    await lockUser(tx, subscription.userId);
    return syncSubscription(tx, id, subscription.userId, provider);
  });
}
export async function cancelSubscription(
  id: string,
  actorId: string,
  admin = false,
  provider: Gateway = gateway,
) {
  assertBillingEnabled();
  // Persist the request independently so ambiguous provider failures stay visible.
  await audit(actorId, 'subscription.cancel.requested', id);
  return db.transaction(async (tx) => {
    const [subscription] = await tx
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.environment, environment())));
    if (!subscription || (!admin && subscription.userId !== actorId))
      throw new HttpError(404, 'Subscription not found.');
    await lockUser(tx, subscription.userId);
    const current = await syncSubscription(tx, id, subscription.userId, provider);
    if (!['canceled', 'expired', 'scheduled_cancel'].includes(current.status))
      await provider.cancel(id);
    const confirmed = await syncSubscription(tx, id, subscription.userId, provider);
    await tx.insert(auditLogs).values({
      id: randomUUID(),
      actorId,
      action: 'subscription.cancel.reconciled',
      targetId: id,
      details: { status: confirmed.status },
    });
    return confirmed;
  });
}
export async function portalUrl(userId: string, provider: Gateway = gateway) {
  assertBillingEnabled();
  const [customer] = await db
    .select()
    .from(billingCustomers)
    .where(
      and(eq(billingCustomers.userId, userId), eq(billingCustomers.environment, environment())),
    );
  if (!customer) throw new HttpError(404, 'No billing customer found.');
  return safeBillingUrl((await provider.portal(customer.customerId)).customer_portal_link);
}
export async function syncSubscriptionEvent(
  tx: Transaction,
  id: string,
  provider: Gateway = gateway,
) {
  const remote = await provider.subscription(id);
  assertMode(remote.mode);
  const [customer] = await tx
    .select()
    .from(billingCustomers)
    .where(
      and(
        eq(billingCustomers.customerId, remoteId(remote.customer)),
        eq(billingCustomers.environment, environment()),
      ),
    );
  if (!customer) throw new Error('Checkout customer mapping not yet available');
  await lockUser(tx, customer.userId);
  await syncSubscription(tx, id, customer.userId, provider);
}
export async function applyPaymentHold(
  tx: Transaction,
  transactionId: string,
  dispute: boolean,
  provider: Gateway = gateway,
) {
  const transaction = await provider.transaction(transactionId);
  assertMode(transaction.mode);
  if (!transaction.customer) throw new Error('Missing transaction customer');
  const [customer] = await tx
    .select()
    .from(billingCustomers)
    .where(
      and(
        eq(billingCustomers.customerId, transaction.customer),
        eq(billingCustomers.environment, environment()),
      ),
    );
  if (!customer) throw new Error('Payment mapping not yet available');
  await lockUser(tx, customer.userId);
  // A signed refund may precede settlement or the subscription row itself.
  // Persist the hold independently so neither ordering can silently grant access.
  await tx
    .insert(paymentHolds)
    .values({
      id: randomUUID(),
      userId: customer.userId,
      transactionId,
      subscriptionId: transaction.subscription ?? null,
      environment: environment(),
      reason: dispute ? 'dispute' : 'refund_review',
    })
    .onConflictDoNothing();
  if (transaction.subscription)
    await tx
      .update(subscriptions)
      .set({ held: true })
      .where(
        and(
          eq(subscriptions.id, transaction.subscription),
          eq(subscriptions.userId, customer.userId),
          eq(subscriptions.environment, environment()),
        ),
      );
  else
    await tx
      .update(purchases)
      .set({ status: 'revoked' })
      .where(
        and(
          eq(purchases.transactionId, transactionId),
          eq(purchases.userId, customer.userId),
          eq(purchases.environment, environment()),
        ),
      );
}
