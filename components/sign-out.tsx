'use client';
import { authClient } from '@/lib/auth/client';
import { useState } from 'react';
import { Button } from './ui/button';
export function SignOut() {
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  return (
    <div>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError('');
          try {
            const result = await authClient.signOut();
            if (result.error) throw new Error();
            window.location.assign('/');
          } catch {
            setError('Unable to sign out. Please try again.');
            setPending(false);
          }
        }}
      >
        {pending ? 'Signing out…' : 'Sign out'}
      </Button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
