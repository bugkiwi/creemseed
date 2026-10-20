import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main-content" className="wrap policy-page">
      <p className="eyebrow">404</p>
      <h1>A little off the path.</h1>
      <p>This page could not be found.</p>
      <Link href="/">Return home →</Link>
    </main>
  );
}
