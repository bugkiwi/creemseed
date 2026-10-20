'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export function BillingAction({
  action,
  body = {},
  children,
  variant = 'default',
  confirmText,
}: {
  action: string;
  body?: Record<string, string>;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  confirmText?: string;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [done, setDone] = useState(false);
  const router = useRouter();
  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setPending(true);
    setError('');
    setDone(false);
    try {
      const result = await fetch(`/api/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await result.json();
      if (!result.ok) {
        if (result.status === 401) {
          router.push('/sign-in');
          return;
        }
        throw new Error(data.error || 'Request failed.');
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setDone(true);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="action">
      <Button onClick={run} disabled={pending} variant={variant}>
        {pending ? 'Working…' : children}
      </Button>
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : done ? (
        <span role="status" className="muted small">
          Updated.
        </span>
      ) : null}
    </div>
  );
}
export function CheckoutRecovery({
  attemptId,
  checkoutId,
}: {
  attemptId: string;
  checkoutId: string | null;
}) {
  const [id, setId] = useState(checkoutId || '');
  return (
    <div className="recovery">
      <label className="sr-only" htmlFor={`checkout-${attemptId}`}>
        Creem checkout ID
      </label>
      <input
        id={`checkout-${attemptId}`}
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="ch_…"
        autoComplete="off"
      />
      <BillingAction
        action="admin/reconcile-checkout"
        body={{ attemptId, checkoutId: id }}
        variant="outline"
      >
        Reconcile
      </BillingAction>
    </div>
  );
}
