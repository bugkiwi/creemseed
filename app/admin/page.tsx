import Link from 'next/link';
import { and, count, eq, gt, inArray } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { user, subscriptions, billingEvents } from '@/lib/db/schema';
import { environment } from '@/lib/billing/creem';
import { Button } from '@/components/ui/button';

export default async function Admin() {
  await requireAdmin(true);
  const env = environment();
  const [users, entitled, failed] = await Promise.all([
    db.select({ value: count() }).from(user),
    db
      .select({ value: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.environment, env),
          eq(subscriptions.held, false),
          eq(subscriptions.paymentVerified, true),
          inArray(subscriptions.status, ['active', 'scheduled_cancel']),
          gt(subscriptions.periodEnd, new Date()),
        ),
      ),
    db
      .select({ value: count() })
      .from(billingEvents)
      .where(and(eq(billingEvents.environment, env), eq(billingEvents.status, 'failed'))),
  ]);
  return (
    <>
      <p className="eyebrow">ADMIN DESK · {env.toUpperCase()} MODE</p>
      <h1>A clear view.</h1>
      <p className="lede">The people, plans and payments behind your product.</p>
      <div className="stats">
        <Link href="/admin/customers">
          <span>Accounts</span>
          <strong>{users[0].value}</strong>
        </Link>
        <Link href="/admin/subscriptions">
          <span>Entitled subscriptions</span>
          <strong>{entitled[0].value}</strong>
        </Link>
        <Link href="/admin/events">
          <span>Events needing attention</span>
          <strong>{failed[0].value}</strong>
        </Link>
      </div>
      <section className="admin-note">
        <h2>Billing operations</h2>
        <p>
          Reconcile canonical subscription state, investigate an uncertain checkout, or replay a
          failed event. Refunds, disputes and product configuration stay in your Creem merchant
          dashboard.
        </p>
        <div className="button-row">
          <Button asChild variant="outline">
            <a href="https://creem.io/dashboard" target="_blank" rel="noopener noreferrer">
              Open Creem ↗
            </a>
          </Button>
          <Link href="/admin/audit">View audit log →</Link>
        </div>
      </section>
    </>
  );
}
