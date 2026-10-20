import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { appUrl, site } from '../lib/config';
import { enabledPlans } from '../lib/billing/plans';
import { environment } from '../lib/billing/creem';
import { validateSettings } from './setup-schema.mjs';
import { isDemoMode } from '../lib/deployment';
const errors: string[] = [],
  warnings: string[] = [];
const need = (key: string) => {
  if (!process.env[key]?.trim() || /USER:PASSWORD/.test(process.env[key]!))
    errors.push(`Set ${key}.`);
};
try {
  validateSettings(site);
  const url = new URL(appUrl()),
    local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!local && url.protocol !== 'https:') errors.push('Use HTTPS outside localhost.');
  const demo = isDemoMode();
  if (!['true', 'false'].includes(process.env.DEMO_MODE || 'false'))
    errors.push('DEMO_MODE must be true or false.');
  if (!demo) {
    need('DATABASE_URL');
    need('BETTER_AUTH_SECRET');
    if ((process.env.BETTER_AUTH_SECRET?.length || 0) < 32)
      errors.push('BETTER_AUTH_SECRET needs at least 32 random characters.');
    if (site.auth.includes('email') && site.email === 'console' && !local)
      errors.push('Deployed email/password authentication requires Resend.');
    if (site.email === 'resend') {
      need('RESEND_API_KEY');
      need('EMAIL_FROM');
    }
    for (const provider of ['google', 'github'])
      if (site.auth.includes(provider)) {
        need(`${provider.toUpperCase()}_CLIENT_ID`);
        need(`${provider.toUpperCase()}_CLIENT_SECRET`);
      }
    environment();
  } else
    warnings.push(
      'Public demo mode: accounts, billing, and webhooks are disabled; no database or provider credentials are needed.',
    );
  if (!['true', 'false'].includes(process.env.BILLING_ENABLED || 'false'))
    errors.push('BILLING_ENABLED must be true or false.');
  if (process.env.BILLING_ENABLED === 'true') {
    if (demo) errors.push('BILLING_ENABLED must remain false in demo mode.');
    need('CREEM_API_KEY');
    need('CREEM_WEBHOOK_SECRET');
    for (const plan of enabledPlans()) need(plan.productEnv);
  } else warnings.push('Billing is disabled; signup and public pages can still run.');
  if (!demo && environment() === 'live')
    warnings.push('Live mode selected. Validate the catalog and complete the release checklist.');
  if (site.analytics.posthog) need('NEXT_PUBLIC_POSTHOG_KEY');
  if (!['none', 'vercel', 'x-real-ip'].includes(process.env.TRUSTED_PROXY || 'none'))
    errors.push('Invalid TRUSTED_PROXY.');
  if (!demo && !local && (!process.env.TRUSTED_PROXY || process.env.TRUSTED_PROXY === 'none'))
    warnings.push(
      'Auth uses a shared IP rate-limit bucket until a trusted proxy is configured. Configure edge limits too.',
    );
  const known = new Set(
    (await readFile(new URL('../.env.example', import.meta.url), 'utf8'))
      .split('\n')
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => line.split('=')[0]),
  );
  ['POSTGRES_PORT', 'LOCAL_POSTGRES_PASSWORD', 'COMPOSE_PROJECT_NAME'].forEach((key) =>
    known.add(key),
  );
  let raw = '';
  try {
    raw = await readFile(new URL('../.env', import.meta.url), 'utf8');
  } catch {}
  const seen = new Set<string>();
  for (const line of raw.split('\n')) {
    const key = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/)?.[1];
    if (!key) continue;
    if (seen.has(key)) errors.push(`Duplicate variable: ${key}.`);
    if (!known.has(key)) warnings.push(`Undocumented variable: ${key}.`);
    seen.add(key);
  }
} catch {
  errors.push('Configuration is invalid. Check app origin and Creem key/environment pairing.');
}
for (const warning of warnings) console.log(`Note: ${warning}`);
for (const error of errors) console.error(`Error: ${error}`);
if (errors.length) process.exitCode = 1;
else console.log('Environment shape is valid. External services have not been exercised.');
