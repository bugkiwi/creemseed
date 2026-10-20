'use client';
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="wrap policy-page">
      <h1>Something needs a moment.</h1>
      <p>The request could not be completed.</p>
      <button onClick={reset} className="plain-link">
        Try again →
      </button>
    </main>
  );
}
