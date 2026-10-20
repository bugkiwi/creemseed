import Link from 'next/link';
import { site, isLocal } from '@/lib/config';
import { AuthForm } from './auth-form';
import { Brand } from './brand';

export function AuthPage({
  mode,
  token,
}: {
  mode: 'sign-in' | 'sign-up' | 'forgot' | 'reset';
  token?: string;
}) {
  const title = {
    'sign-in': 'Welcome back.',
    'sign-up': 'Something starts here.',
    forgot: 'Forgot your password?',
    reset: 'A fresh start.',
  }[mode];
  return (
    <main className="auth-shell">
      <div className="auth-aside">
        <Brand />
        <div>
          <p className="eyebrow">YOUR NEXT CHAPTER</p>
          <h2>
            Make room
            <br />
            for the work
            <br />
            <em>that matters.</em>
          </h2>
        </div>
        <Link href="/">← Back to home</Link>
      </div>
      <div className="auth-main">
        <div className="auth-box">
          <p className="eyebrow">{mode === 'sign-up' ? 'CREATE YOUR ACCOUNT' : 'YOUR WORKSPACE'}</p>
          <h1>{title}</h1>
          <p className="muted">
            {mode === 'sign-up'
              ? 'One account. Your workspace and billing, together.'
              : 'A little less setup. A little more progress.'}
          </p>
          <AuthForm
            mode={mode}
            token={token}
            providers={site.auth.filter((p) => p !== 'email')}
            emailEnabled={site.auth.includes('email') && (isLocal() || site.email === 'resend')}
          />
        </div>
      </div>
    </main>
  );
}
