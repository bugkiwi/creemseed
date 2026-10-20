import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Pricing } from '@/components/pricing';
export const metadata: Metadata = { title: 'Pricing' };
export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="wrap pricing-page">
        <p className="eyebrow">ROOM TO GROW</p>
        <h1>Choose your rhythm.</h1>
        <p className="lede">
          A clear price. A workspace of your own. Manage your plan whenever you need.
        </p>
        <Pricing />
        <p className="small muted">
          These are example plans for a starter application. Billing remains disabled until the
          operator configures Creem products.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
