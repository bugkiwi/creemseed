import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" /> A FOUNDATION FOR YOUR NEXT IDEA
            </p>
            <h1>
              Start small.
              <br />
              Build something
              <br />
              <em>worth paying for.</em>
            </h1>
            <p className="hero-description">
              Your product deserves your attention. Accounts, subscriptions and a thoughtful
              workspace are already here.
            </p>
            <div className="button-row">
              <Button asChild>
                <Link href="/sign-up">
                  Create your workspace <ArrowUpRight size={17} />
                </Link>
              </Button>
              <Link className="plain-link" href="/pricing">
                Explore plans <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="hero-footnote">Next.js · Better Auth · Creem</p>
          </div>
          <div
            className="hero-art"
            aria-label="A simple foundation: identity, billing and your product"
          >
            <div className="art-caption">
              <span>THE STARTING POINT</span>
              <span>01 / 03</span>
            </div>
            <div className="art-orbit">
              <div className="orbit-one" />
              <div className="orbit-two" />
              <svg viewBox="0 0 200 200" className="seed-drawing" fill="none" aria-hidden="true">
                <path
                  d="M99 166V90M99 123C49 123 31 88 35 43c48-4 83 14 80 67M99 91c0-43 28-68 70-64 2 43-20 72-65 70"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="orbit-label label-identity">
                Identity <Check size={13} />
              </span>
              <span className="orbit-label label-billing">
                Billing <Check size={13} />
              </span>
              <span className="orbit-label label-product">Your product ↗</span>
            </div>
            <div className="art-bottom">
              <span>
                A little structure.
                <br />A lot of possibility.
              </span>
              <span className="art-mark">cs.</span>
            </div>
          </div>
        </section>
        <section className="foundation wrap">
          <div>
            <p className="eyebrow">THE ESSENTIALS, CONSIDERED</p>
            <h2>
              Less groundwork.
              <br />
              <em>More forward.</em>
            </h2>
          </div>
          <div className="feature-list">
            {[
              [
                '01',
                'A place to belong',
                'Email and social sign-in, verified accounts, and a workspace that feels like home.',
              ],
              [
                '02',
                'A way to grow',
                'Recurring plans, hosted checkout and a customer portal for the everyday work of billing.',
              ],
              [
                '03',
                'A clear view',
                'An admin desk for customers, subscriptions and the events that connect them.',
              ],
            ].map(([n, title, description]) => (
              <article key={n}>
                <span className="feature-number">{n}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="closing wrap">
          <p className="eyebrow">YOUR IDEA GOES HERE</p>
          <h2>Give it a good beginning.</h2>
          <Button asChild>
            <Link href="/sign-up">
              Get started <ArrowUpRight size={17} />
            </Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
