import Link from 'next/link';
import { requireUser } from '@/lib/auth/session';
import { billingState } from '@/lib/billing/service';
import { Button } from '@/components/ui/button';
export default async function Dashboard() {
  const user = await requireUser(true),
    state = await billingState(user.id);
  return (
    <>
      <p className="eyebrow">A GOOD PLACE TO START</p>
      <h1>Hello, {user.name}.</h1>
      <p className="lede">Your next idea has a home.</p>
      <section className="workspace-welcome">
        <div>
          <span className={`badge ${state.hasAccess ? 'badge-success' : ''}`}>
            {state.hasAccess ? 'Paid access active' : 'Free workspace'}
          </span>
          <h2>{state.hasAccess ? 'Ready for your best work.' : 'Make it yours.'}</h2>
          <p>
            Build your product here. Your account and billing are connected, with room for
            everything that comes next.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/billing">Manage your plan ↗</Link>
          </Button>
        </div>
        <svg viewBox="0 0 200 200" width="180" height="180" fill="none" aria-hidden="true">
          <circle cx="100" cy="100" r="85" stroke="currentColor" opacity=".25" />
          <path
            d="M100 160V85m0 35C55 120 35 90 40 45c45-5 70 20 70 55m-10-15c0-40 25-60 65-55 0 40-20 60-60 60"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </section>
      <section className="account-details">
        <h2>Your account</h2>
        <dl>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Verification</dt>
            <dd>{user.emailVerified ? 'Verified' : 'Check your inbox'}</dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>{state.hasAccess ? 'Full workspace' : 'Choose a plan to unlock paid features'}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
