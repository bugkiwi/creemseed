import { isLocal, requiredEnv, site } from './config';

export async function sendAuthEmail(to: string, url: string, purpose: 'verify' | 'reset') {
  const subject =
    purpose === 'verify' ? `Verify your ${site.name} email` : `Reset your ${site.name} password`;
  if (site.email === 'console' && isLocal()) {
    // Local-only output: never enable this transport on a public deployment.
    console.info(`[Local email] ${subject}\n${url}`);
    return;
  }
  if (site.email !== 'resend')
    throw new Error(
      'Configure transactional email before enabling password authentication in production',
    );
  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requiredEnv('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: requiredEnv('EMAIL_FROM'),
      to,
      subject,
      text: `${subject}\n\n${url}\n\nIf you did not request this email, you can ignore it.`,
    }),
    signal: AbortSignal.timeout(10_000),
    redirect: 'error',
  });
  if (!result.ok) throw new Error('Email delivery failed');
}
