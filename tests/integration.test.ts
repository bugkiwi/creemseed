import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { eq } from 'drizzle-orm';
import type { Gateway } from '../lib/billing/creem';
import config from '../starter.config.json';

// The suite never reads DATABASE_URL as its target. An explicit loopback test
// database with the required name is mandatory, even on developer machines.
test(
  'isolated Postgres: billing concurrency, lifecycle, retries and identity boundaries',
  { skip: !process.env.TEST_DATABASE_URL },
  async (t) => {
    const target = new URL(process.env.TEST_DATABASE_URL!);
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(target.hostname));
    assert.match(target.pathname, /^\/creemseed_test(?:_[a-z0-9]+)?$/);
    process.env.DATABASE_URL = target.toString();
    process.env.DEMO_MODE = 'false';
    process.env.CREEM_ENVIRONMENT = 'test';
    process.env.CREEM_API_KEY = 'creem_test_' + 'fixture';
    process.env.CREEM_WEBHOOK_SECRET = 'fixture-only-'.repeat(4);
    process.env.BILLING_ENABLED = 'true';
    process.env.CREEM_PRODUCT_PRO_MONTHLY = 'prod_TestMonth';
    process.env.CREEM_PRODUCT_PRO_YEARLY = 'prod_TestYear';
    process.env.CREEM_PRODUCT_LIFETIME = 'prod_TestLifetime';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.BETTER_AUTH_SECRET = 'fixture-only-auth-'.repeat(4);
    const originalAdminEmails = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = '';
    const migration = spawnSync('pnpm', ['db:migrate'], { env: process.env, encoding: 'utf8' });
    assert.equal(migration.status, 0, 'isolated database migrations must succeed');
    const { db } = await import('../lib/db');
    const schema = await import('../lib/db/schema');
    const service = await import('../lib/billing/service');
    const events = await import('../lib/billing/events');
    const { provisionConfiguredAdmin } = await import('../lib/auth/admin-role');
    const id = randomUUID(),
      secondId = randomUUID();
    const [owner, other] = await db
      .insert(schema.user)
      .values([
        { id, email: `${id}@example.test`, name: 'Fixture', emailVerified: true },
        {
          id: secondId,
          email: `${secondId}@example.test`,
          name: 'Other fixture',
          emailVerified: true,
        },
      ])
      .returning();
    let createCalls = 0,
      cancelCalls = 0,
      subscriptionStatus = 'active',
      throwOnce = false;
    let currentCheckout: Awaited<ReturnType<Gateway['checkout']>> | undefined;
    const provider: Gateway = {
      product: async (id) => ({
        id,
        mode: 'test',
        status: 'active',
        price: 990,
        currency: 'USD',
        billing_type: 'recurring',
        billing_period: 'every-month',
        tax_mode: 'inclusive',
        trial_period_days: 7,
      }),
      createCheckout: async (input) => {
        createCalls++;
        const body = input as { metadata: Record<string, string>; product_id: string };
        currentCheckout = {
          id: 'ch_Test' + createCalls,
          mode: 'test',
          status: 'open',
          product: body.product_id,
          units: 1,
          metadata: body.metadata,
          checkout_url: 'https://www.creem.io/test/checkout',
        };
        if (throwOnce) {
          throwOnce = false;
          throw new Error('simulated lost response');
        }
        return currentCheckout;
      },
      checkout: async (id) => {
        assert.equal(id, currentCheckout?.id);
        return currentCheckout!;
      },
      subscription: async (id) => ({
        id,
        mode: 'test',
        product: 'prod_TestMonth',
        customer: 'cust_Test',
        status: subscriptionStatus,
        current_period_start_date: new Date().toISOString(),
        current_period_end_date: new Date(Date.now() + 86400000).toISOString(),
        last_transaction_id: 'tran_Test',
      }),
      transaction: async (id) => ({
        id,
        mode: 'test',
        type: 'invoice',
        status: 'paid',
        amount: 990,
        amount_paid: 990,
        currency: 'USD',
        subscription: 'sub_Test',
        customer: 'cust_Test',
        order: 'ord_Test',
      }),
      portal: async () => ({ customer_portal_link: 'https://www.creem.io/my-orders/login' }),
      cancel: async (id) => {
        cancelCalls++;
        subscriptionStatus = 'scheduled_cancel';
        return provider.subscription(id);
      },
    };
    try {
      await t.test('verified allowlisted emails are promoted and audited once', async () => {
        process.env.ADMIN_EMAILS = ` ${owner.email.toUpperCase()} , ${other.email} `;
        const [first, second] = await Promise.all([
          provisionConfiguredAdmin(owner),
          provisionConfiguredAdmin(owner),
        ]);
        assert.equal(first?.role, 'admin');
        assert.equal(second?.role, 'admin');
        const grants = await db
          .select()
          .from(schema.auditLogs)
          .where(eq(schema.auditLogs.targetId, owner.id));
        assert.equal(grants.filter((entry) => entry.action === 'admin.grant.env').length, 1);
        assert.equal(
          (await provisionConfiguredAdmin({ ...other, emailVerified: false }))?.role,
          'user',
        );
      });
      process.env.ADMIN_EMAILS = '';
      await t.test(
        'concurrent checkout creates a single durable intent and reuses its URL',
        async () => {
          const results = await Promise.allSettled([
            service.startCheckout(owner, 'pro-monthly', provider),
            service.startCheckout(owner, 'pro-monthly', provider),
          ]);
          assert.ok(results.some((r) => r.status === 'fulfilled'));
          assert.equal(createCalls, 1);
          assert.equal(
            await service.startCheckout(owner, 'pro-monthly', provider),
            'https://www.creem.io/test/checkout',
          );
          assert.equal(createCalls, 1);
        },
      );
      await t.test(
        'duplicate completion events atomically map the customer and subscription once',
        async () => {
          currentCheckout = {
            ...currentCheckout!,
            status: 'completed',
            customer: 'cust_Test',
            subscription: 'sub_Test',
            order: {
              id: 'ord_Test',
              product: 'prod_TestMonth',
              status: 'paid',
              transaction: 'tran_Test',
              currency: 'USD',
              type: 'recurring',
              amount_paid: 990,
            },
          };
          const event = {
            id: 'evt_' + randomUUID().replaceAll('-', ''),
            type: 'checkout.completed',
            objectId: currentCheckout.id,
            relatedId: null,
            bodyHash: 'fixture-hash',
          };
          await events.recordEvent(event);
          const results = await Promise.all([
            events.processEvent(event.id, provider),
            events.processEvent(event.id, provider),
          ]);
          assert.ok(results.some((r) => 'duplicate' in r && r.duplicate));
          const [record] = await db
            .select()
            .from(schema.billingEvents)
            .where(eq(schema.billingEvents.id, event.id));
          assert.equal(record.status, 'processed');
          assert.equal(record.attempts, 1);
          assert.equal((await service.billingState(owner.id)).hasAccess, true);
          await assert.rejects(events.recordEvent({ ...event, bodyHash: 'changed' }));
        },
      );
      await t.test('ownership rejects another account cancellation and portal access', async () => {
        await assert.rejects(service.cancelSubscription('sub_Test', other.id, false, provider));
        await assert.rejects(service.portalUrl(other.id, provider));
        assert.equal(cancelCalls, 0);
      });
      await t.test(
        'scheduled cancel retains paid access, past due revokes, hold is sticky',
        async () => {
          await service.cancelSubscription('sub_Test', owner.id, false, provider);
          assert.equal(cancelCalls, 1);
          assert.equal((await service.billingState(owner.id)).hasAccess, true);
          subscriptionStatus = 'past_due';
          await service.reconcileSubscription('sub_Test', owner.id, provider);
          assert.equal((await service.billingState(owner.id)).hasAccess, false);
          await db
            .update(schema.subscriptions)
            .set({ held: true })
            .where(eq(schema.subscriptions.id, 'sub_Test'));
          subscriptionStatus = 'active';
          await service.reconcileSubscription('sub_Test', owner.id, provider);
          assert.equal((await service.billingState(owner.id)).hasAccess, false);
          assert.equal((await service.billingState(owner.id)).subscriptions[0].held, true);
        },
      );
      await t.test(
        'failed event rolls back effects, remains retryable and succeeds after recovery',
        async () => {
          const event = {
            id: 'evt_' + randomUUID().replaceAll('-', ''),
            type: 'subscription.paid',
            objectId: 'sub_Test',
            relatedId: null,
            bodyHash: 'retry-hash',
          };
          await events.recordEvent(event);
          const failing = {
            ...provider,
            subscription: async () => {
              throw new Error('fixture outage');
            },
          };
          await assert.rejects(events.processEvent(event.id, failing));
          let [record] = await db
            .select()
            .from(schema.billingEvents)
            .where(eq(schema.billingEvents.id, event.id));
          assert.equal(record.status, 'failed');
          assert.equal(record.attempts, 1);
          await events.processEvent(event.id, provider);
          [record] = await db
            .select()
            .from(schema.billingEvents)
            .where(eq(schema.billingEvents.id, event.id));
          assert.equal(record.status, 'processed');
          assert.equal(record.attempts, 2);
        },
      );
      await t.test(
        'lost checkout response is persisted as uncertain and cannot be blindly retried',
        async () => {
          throwOnce = true;
          await assert.rejects(service.startCheckout(other, 'pro-monthly', provider));
          const count = createCalls;
          await assert.rejects(service.startCheckout(other, 'pro-monthly', provider));
          assert.equal(createCalls, count);
          const attempt = (await service.billingState(other.id)).attempts[0];
          assert.equal(attempt.status, 'uncertain');
          await assert.rejects(
            db.transaction((tx) =>
              service.syncCheckout(tx, currentCheckout!.id, randomUUID(), provider),
            ),
          );
          await db.transaction((tx) =>
            service.syncCheckout(tx, currentCheckout!.id, attempt.id, provider),
          );
          assert.equal((await service.billingState(other.id)).attempts[0].status, 'open');
        },
      );
      await t.test(
        'refund/dispute holds persist even before a subscription snapshot exists',
        async () => {
          const early: Gateway = {
            ...provider,
            transaction: async (id) => ({
              ...(await provider.transaction(id)),
              subscription: 'sub_Early',
            }),
            subscription: async (id) => ({
              ...(await provider.subscription(id)),
              last_transaction_id: 'tran_Early',
            }),
          };
          await db.transaction((tx) => service.applyPaymentHold(tx, 'tran_Early', true, early));
          await db.transaction(async (tx) => {
            await service.lockUser(tx, owner.id);
            await service.syncSubscription(tx, 'sub_Early', owner.id, early);
          });
          const [sub] = await db
            .select()
            .from(schema.subscriptions)
            .where(eq(schema.subscriptions.id, 'sub_Early'));
          assert.equal(sub.held, true);
        },
      );
      await t.test(
        'one-time completion is bound to a transaction and refund replay cannot restore access',
        async () => {
          const attemptId = randomUUID();
          await db.insert(schema.checkoutAttempts).values({
            id: attemptId,
            userId: other.id,
            planKey: 'lifetime',
            productId: 'prod_TestLifetime',
            environment: 'test',
          });
          const once: Gateway = {
            ...provider,
            checkout: async (id) => ({
              id,
              mode: 'test',
              product: 'prod_TestLifetime',
              customer: 'cust_Lifetime',
              units: 1,
              status: 'completed',
              metadata: { userId: other.id, attemptId },
              order: {
                id: 'ord_Lifetime',
                product: 'prod_TestLifetime',
                customer: 'cust_Lifetime',
                status: 'paid',
                transaction: 'tran_Lifetime',
                amount_paid: 29900,
                currency: 'USD',
                type: 'onetime',
              },
            }),
            transaction: async (id) => ({
              id,
              mode: 'test',
              type: 'payment',
              status: 'paid',
              amount: 29900,
              amount_paid: 29900,
              currency: 'USD',
              customer: 'cust_Lifetime',
              subscription: null,
              order: 'ord_Lifetime',
            }),
          };
          await db.transaction((tx) => service.syncCheckout(tx, 'ch_Lifetime', attemptId, once));
          assert.equal((await service.billingState(other.id)).hasAccess, true);
          const event = {
            id: 'evt_' + randomUUID().replaceAll('-', ''),
            type: 'refund.created',
            objectId: 'ref_Test',
            relatedId: 'tran_Lifetime',
            bodyHash: 'refund-fixture',
          };
          await events.recordEvent(event);
          await events.processEvent(event.id, once);
          assert.equal((await service.billingState(other.id)).hasAccess, false);
          await db.transaction((tx) => service.syncCheckout(tx, 'ch_Lifetime', attemptId, once));
          assert.equal((await service.billingState(other.id)).hasAccess, false);
        },
      );
      await t.test(
        'Better Auth rejects cross-origin signup and public role injection; verification is required',
        async () => {
          const { createAuth } = await import('../lib/auth');
          let localEmail = '';
          // Override only this factory instance: fixtures never send real mail or
          // initialize the operator's selected OAuth providers.
          const auth = createAuth(
            { ...config, auth: ['email'], email: 'console' },
            async (_to, url) => {
              localEmail = url;
            },
          );
          const email = `${randomUUID()}@example.test`,
            password = 'fixture-password-1234';
          const request = (origin: string) =>
            new Request('http://localhost:3000/api/auth/sign-up/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Origin: origin },
              body: JSON.stringify({ email, password, name: 'Auth fixture', role: 'admin' }),
            });
          const rejected = await auth.handler(request('https://untrusted.example'));
          assert.equal(rejected.status, 403);
          const result = await auth.handler(request('http://localhost:3000'));
          assert.equal(result.status, 200);
          const [account] = await db.select().from(schema.user).where(eq(schema.user.email, email));
          assert.equal(account.role, 'user');
          assert.equal(account.emailVerified, false);
          const login = () =>
            auth.handler(
              new Request('http://localhost:3000/api/auth/sign-in/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
                body: JSON.stringify({ email, password }),
              }),
            );
          assert.equal((await login()).status, 403);
          const url = localEmail.match(/https?:\/\/[^\s]+/)?.[0];
          assert.ok(url, 'verification is delivered only through the local transport fixture');
          const verification = await auth.handler(new Request(url));
          assert.ok([200, 302].includes(verification.status));
          assert.equal((await login()).status, 200);
          await db.delete(schema.user).where(eq(schema.user.id, account.id));
        },
      );
    } finally {
      // Dedicated database only. No user data or external account is involved.
      for (const table of [
        schema.billingEvents,
        schema.auditLogs,
        schema.paymentHolds,
        schema.purchases,
        schema.subscriptions,
        schema.checkoutAttempts,
        schema.billingCustomers,
      ])
        await db.delete(table);
      await db.delete(schema.user).where(eq(schema.user.id, owner.id));
      await db.delete(schema.user).where(eq(schema.user.id, other.id));
      const client = (db as unknown as { $client: { end: () => Promise<void> } }).$client;
      await client.end();
      if (originalAdminEmails === undefined) delete process.env.ADMIN_EMAILS;
      else process.env.ADMIN_EMAILS = originalAdminEmails;
    }
  },
);
