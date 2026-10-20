import Link from 'next/link';
import { site, isLocal } from '@/lib/config';
import { AuthForm } from './auth-form';
import { Brand } from './brand';
import { isDemoMode } from '@/lib/deployment';
import { project, deployUrl } from '@/lib/project';
import { Button } from './ui/button';

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
          {isDemoMode() ? (
            <div className="form-stack">
              <p className="notice">
                This public demo does not create accounts or accept payments. Deploy your own copy
                to use authentication and billing.
              </p>
              <Button asChild>
                <a href={deployUrl}>Deploy your copy ↗</a>
              </Button>
              <a className="plain-link" href={project.repository}>
                View the source on GitHub →
              </a>
            </div>
          ) : (
            <AuthForm
              mode={mode}
              token={token}
              providers={site.auth.filter((p) => p !== 'email')}
              emailEnabled={site.auth.includes('email') && (isLocal() || site.email === 'resend')}
            />
          )}
        </div>
      </div>
    </main>
  );
}
