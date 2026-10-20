import { and, eq, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { billingEvents } from '@/lib/db/schema';
import { environment, gateway, ref, type Gateway } from './creem';
import { applyPaymentHold, syncCheckout, syncSubscriptionEvent } from './service';
import type { verifyEvent } from './signature';

const subscriptionEvents = new Set([
  'subscription.active',
  'subscription.paid',
  'subscription.update',
  'subscription.canceled',
  'subscription.scheduled_cancel',
  'subscription.past_due',
  'subscription.unpaid',
  'subscription.expired',
  'subscription.trialing',
  'subscription.paused',
]);
export async function recordEvent(event: ReturnType<typeof verifyEvent>) {
  await db
    .insert(billingEvents)
    .values({ ...event, environment: environment() })
    .onConflictDoNothing();
  const [existing] = await db.select().from(billingEvents).where(eq(billingEvents.id, event.id));
  if (!existing || existing.bodyHash !== event.bodyHash || existing.environment !== environment())
    throw new Error('Webhook event collision');
}
export async function processEvent(id: string, provider: Gateway = gateway) {
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select id from billing_events where id=${id} for update`);
      const [event] = await tx
        .select()
        .from(billingEvents)
        .where(and(eq(billingEvents.id, id), eq(billingEvents.environment, environment())));
      if (!event) throw new Error('Event unavailable');
      if (['processed', 'ignored'].includes(event.status)) return { duplicate: true };
      let ignored = false;
      if (event.type === 'checkout.completed')
        await syncCheckout(tx, ref('ch').parse(event.objectId), undefined, provider);
      else if (subscriptionEvents.has(event.type))
        await syncSubscriptionEvent(tx, ref('sub').parse(event.objectId), provider);
      else if (['refund.created', 'dispute.created'].includes(event.type))
        await applyPaymentHold(
          tx,
          ref('tran').parse(event.relatedId),
          event.type === 'dispute.created',
          provider,
        );
      else ignored = true;
      await tx
        .update(billingEvents)
        .set({
          status: ignored ? 'ignored' : 'processed',
          errorCode: null,
          processedAt: new Date(),
          attempts: event.attempts + 1,
        })
        .where(eq(billingEvents.id, id));
      return { processed: !ignored, ignored };
    });
  } catch (error) {
    await db
      .update(billingEvents)
      .set({
        status: 'failed',
        errorCode: 'reconciliation_failed',
        attempts: sql`${billingEvents.attempts} + 1`,
      })
      .where(
        and(
          eq(billingEvents.id, id),
          ne(billingEvents.status, 'processed'),
          ne(billingEvents.status, 'ignored'),
        ),
      );
    throw error;
  }
}
