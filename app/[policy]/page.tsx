import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { site } from '@/lib/config';

const titles: Record<string, string> = {
  terms: 'Terms of service',
  privacy: 'Privacy policy',
  refunds: 'Refund policy',
  contact: 'Contact',
};
export function generateStaticParams() {
  return Object.keys(titles).map((policy) => ({ policy }));
}
export async function generateMetadata({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  return { title: titles[policy] || 'Not found', robots: { index: false, follow: false } };
}
export default async function Policy({ params }: { params: Promise<{ policy: string }> }) {
  const { policy } = await params;
  if (!titles[policy]) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="wrap policy-page">
        <p className="eyebrow">{site.name.toUpperCase()}</p>
        <h1>{titles[policy]}</h1>
        <p className="notice">
          Template placeholder — replace this page with your reviewed policy and operator contact
          information before accepting payments.
        </p>
        {policy === 'privacy' ? (
          <>
            <h2>Data handled by this application</h2>
            <p>
              Accounts store a name, email address and authentication records. Billing stores
              customer identifiers, subscription status, payment references and a minimal event
              ledger. Payment details are collected by Creem.
            </p>
            <h2>Optional analytics</h2>
            <p>
              Analytics are disabled by default. If enabled, analytics on public pages require
              consent. Account and admin pages are excluded. Replace this summary with your actual
              processors, retention periods and rights process.
            </p>
          </>
        ) : policy === 'refunds' ? (
          <p>
            Define your cancellation and refund terms, applicable consumer rights, and support
            process here. This template does not publish a refund guarantee.
          </p>
        ) : policy === 'contact' ? (
          <p>
            Add your business identity, support email and contact procedure here. Do not use a
            placeholder inbox for customer support.
          </p>
        ) : (
          <p>
            Describe your service, operator identity, subscription renewal terms, cancellation
            process, acceptable use and applicable legal terms here.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
