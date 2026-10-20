import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq, and, ilike } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/session';
import { db } from '@/lib/db';
import {
  user,
  subscriptions,
  checkoutAttempts,
  billingEvents,
  auditLogs,
  billingCustomers,
} from '@/lib/db/schema';
import { environment } from '@/lib/billing/creem';
import { BillingAction, CheckoutRecovery } from '@/components/billing-actions';

const views = {
  customers: 'Customers',
  subscriptions: 'Subscriptions',
  checkouts: 'Checkouts',
  events: 'Webhooks',
  audit: 'Audit log',
};
const time = (date: Date | null) =>
  date
    ? date.toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })
    : '—';
export default async function View({
  params,
  searchParams,
}: {
  params: Promise<{ view: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin(true);
  const { view } = await params;
  if (!(view in views)) notFound();
  const query = await searchParams,
    env = environment();
  const pageNumber = Number(query.page),
    page = Number.isSafeInteger(pageNumber) && pageNumber > 0 ? Math.min(pageNumber, 10000) : 1;
  const q = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : '';
  const search = `%${q.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
  const offset = (page - 1) * 20;
  let headers: string[] = [],
    rows: React.ReactNode[][] = [];
  if (view === 'customers') {
    const records = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.emailVerified,
        createdAt: user.createdAt,
        customerId: billingCustomers.customerId,
      })
      .from(user)
      .leftJoin(
        billingCustomers,
        and(eq(billingCustomers.userId, user.id), eq(billingCustomers.environment, env)),
      )
      .where(q ? ilike(user.email, search) : undefined)
      .orderBy(desc(user.createdAt))
      .limit(21)
      .offset(offset);
    headers = ['Customer', 'Email', 'Role', 'Creem customer', 'Joined (UTC)'];
    rows = records.map((r) => [
      r.name,
      <span key="email">
        {r.email}
        <br />
        <span className="small muted">{r.verified ? 'Verified' : 'Unverified'}</span>
      </span>,
      r.role,
      r.customerId || '—',
      time(r.createdAt),
    ]);
  } else if (view === 'subscriptions') {
    const records = await db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.environment, env), q ? ilike(subscriptions.id, search) : undefined),
      )
      .orderBy(desc(subscriptions.syncedAt))
      .limit(21)
      .offset(offset);
    headers = ['Subscription', 'Account', 'Plan', 'Status', 'Period end (UTC)', 'Actions'];
    rows = records.map((r) => [
      r.id,
      r.userId,
      r.planKey,
      <span key="status">
        {r.status}
        {r.held ? <strong className="form-error"> · Held</strong> : null}
      </span>,
      time(r.periodEnd),
      <div key="actions" className="table-actions">
        <BillingAction action="admin/reconcile-subscription" body={{ id: r.id }} variant="ghost">
          Reconcile
        </BillingAction>
        {!['canceled', 'expired', 'scheduled_cancel'].includes(r.status) ? (
          <BillingAction
            action="admin/cancel-subscription"
            body={{ id: r.id }}
            variant="outline"
            confirmText="Schedule cancellation of this customer's subscription at period end?"
          >
            Cancel at period end
          </BillingAction>
        ) : null}
      </div>,
    ]);
  } else if (view === 'events') {
    const records = await db
      .select()
      .from(billingEvents)
      .where(
        and(eq(billingEvents.environment, env), q ? ilike(billingEvents.id, search) : undefined),
      )
      .orderBy(desc(billingEvents.createdAt))
      .limit(21)
      .offset(offset);
    headers = ['Event', 'Type', 'Status', 'Attempts', 'Received (UTC)', 'Action'];
    rows = records.map((r) => [
      r.id,
      r.type,
      <span key="status">
        {r.status}
        {r.errorCode ? (
          <span className="small muted">
            <br />
            {r.errorCode}
          </span>
        ) : null}
      </span>,
      r.attempts,
      time(r.createdAt),
      ['failed', 'pending'].includes(r.status) ? (
        <BillingAction key="retry" action="admin/retry-event" body={{ id: r.id }} variant="outline">
          Replay
        </BillingAction>
      ) : (
        '—'
      ),
    ]);
  } else if (view === 'checkouts') {
    const records = await db
      .select()
      .from(checkoutAttempts)
      .where(
        and(
          eq(checkoutAttempts.environment, env),
          q ? ilike(checkoutAttempts.id, search) : undefined,
        ),
      )
      .orderBy(desc(checkoutAttempts.createdAt))
      .limit(21)
      .offset(offset);
    headers = ['Attempt', 'Account', 'Plan', 'Status', 'Created (UTC)', 'Recovery'];
    rows = records.map((r) => [
      r.id,
      r.userId,
      r.planKey,
      r.status,
      time(r.createdAt),
      ['creating', 'open', 'uncertain'].includes(r.status) ? (
        <CheckoutRecovery key="recovery" attemptId={r.id} checkoutId={r.checkoutId} />
      ) : (
        '—'
      ),
    ]);
  } else {
    const records = await db
      .select()
      .from(auditLogs)
      .where(q ? ilike(auditLogs.action, search) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(21)
      .offset(offset);
    headers = ['Action', 'Actor', 'Target', 'Time (UTC)'];
    rows = records.map((r) => [
      r.action,
      r.actorId || 'Local operator',
      r.targetId || '—',
      time(r.createdAt),
    ]);
  }
  const hasNext = rows.length > 20;
  const href = (n: number) =>
    `/admin/${view}?${new URLSearchParams({ page: String(n), ...(q ? { q } : {}) })}`;
  return (
    <>
      <p className="eyebrow">ADMIN DESK · {env.toUpperCase()} MODE</p>
      <h1>{views[view as keyof typeof views]}</h1>
      <form className="search-form">
        <label htmlFor="admin-search" className="sr-only">
          {view === 'customers' ? 'Search email' : 'Search identifier'}
        </label>
        <input
          id="admin-search"
          name="q"
          defaultValue={q}
          maxLength={100}
          placeholder={
            view === 'customers'
              ? 'Search by email…'
              : view === 'audit'
                ? 'Search action…'
                : 'Search by identifier…'
          }
        />
        <button type="submit">Search →</button>
      </form>
      {view === 'checkouts' ? (
        <p className="small muted">
          For an uncertain checkout, find its ID in Creem using the attempt reference.
          Reconciliation verifies the original account, product and intent. It does not create a new
          charge.
        </p>
      ) : null}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 20).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="empty-state">
            <h2>Nothing here yet.</h2>
            <p>
              {q ? 'Try another search.' : 'Records will appear as people use your application.'}
            </p>
          </div>
        ) : null}
      </div>
      <nav className="pagination" aria-label="Pagination">
        {page > 1 ? <Link href={href(page - 1)}>← Previous</Link> : <span />}
        <span>Page {page}</span>
        {hasNext ? <Link href={href(page + 1)}>Next →</Link> : <span />}
      </nav>
    </>
  );
}
