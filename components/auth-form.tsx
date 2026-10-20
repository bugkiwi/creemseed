'use client';
import Link from 'next/link';
import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { Button } from './ui/button';

export function AuthForm({
  mode,
  providers,
  emailEnabled,
  token,
}: {
  mode: 'sign-in' | 'sign-up' | 'forgot' | 'reset';
  providers: string[];
  emailEnabled: boolean;
  token?: string;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    setMessage('');
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') || ''),
      password = String(data.get('password') || '');
    try {
      if (mode === 'sign-up') {
        const result = await authClient.signUp.email({
          name: String(data.get('name')),
          email,
          password,
          callbackURL: '/dashboard',
        });
        if (result.error) throw new Error(result.error.message || 'Unable to create account.');
        setMessage('Check your email to verify your account.');
      } else if (mode === 'sign-in') {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: '/dashboard',
        });
        if (result.error)
          throw new Error('Unable to sign in. Check your details and verify your email.');
        window.location.assign('/dashboard');
      } else if (mode === 'forgot') {
        await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' });
        setMessage('If an account exists, a password reset link has been sent.');
      } else {
        if (!token) throw new Error('The reset link is missing. Request a new one.');
        const result = await authClient.resetPassword({ newPassword: password, token });
        if (result.error)
          throw new Error('This reset link is invalid or has expired. Request a new one.');
        setMessage('Password updated. You can now sign in.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setPending(false);
    }
  }
  async function social(provider: 'google' | 'github') {
    setPending(true);
    setError('');
    try {
      const result = await authClient.signIn.social({ provider, callbackURL: '/dashboard' });
      if (result.error) throw new Error('Unable to start sign in.');
    } catch {
      setError('Unable to start sign in. Please try again.');
      setPending(false);
    }
  }
  const sign = mode === 'sign-in' || mode === 'sign-up';
  return (
    <div>
      {sign && providers.length ? (
        <div className="social-buttons">
          {providers.map((provider) => (
            <Button
              key={provider}
              variant="outline"
              disabled={pending}
              onClick={() => social(provider as 'google' | 'github')}
            >
              Continue with {provider === 'google' ? 'Google' : 'GitHub'}
            </Button>
          ))}
        </div>
      ) : null}
      {emailEnabled ? (
        <form onSubmit={submit} className="form-stack">
          {mode === 'sign-up' ? (
            <label>
              Your name
              <input name="name" autoComplete="name" required maxLength={100} />
            </label>
          ) : null}
          {mode !== 'reset' ? (
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" required maxLength={254} />
            </label>
          ) : null}
          {mode !== 'forgot' ? (
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                minLength={12}
                maxLength={128}
                required
              />
              <span className="muted small">Use at least 12 characters.</span>
            </label>
          ) : null}
          <Button disabled={pending}>
            {pending
              ? 'Please wait…'
              : mode === 'sign-up'
                ? 'Create account'
                : mode === 'sign-in'
                  ? 'Sign in'
                  : mode === 'forgot'
                    ? 'Send reset link'
                    : 'Reset password'}
          </Button>
        </form>
      ) : (
        <p className="muted">
          {sign && providers.length
            ? 'Use one of the sign-in options above.'
            : 'Email sign-in is not configured for this deployment.'}
        </p>
      )}
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="notice">
          {message}
        </p>
      ) : null}
      <div className="auth-links">
        {mode === 'sign-in' ? (
          <>
            <Link href="/sign-up">Create an account</Link>
            {emailEnabled ? <Link href="/forgot-password">Forgot password?</Link> : null}
          </>
        ) : (
          <Link href="/sign-in">Back to sign in</Link>
        )}
      </div>
      {mode === 'sign-up' ? (
        <p className="small muted">
          By continuing, you agree to the <Link href="/terms">Terms</Link> and{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      ) : null}
    </div>
  );
}
