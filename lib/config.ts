import raw from '@/starter.config.json';

export const site = raw;
export function appUrl() {
  // Only a credential-free demo may infer its origin from Vercel's project
  // metadata. Applications with real accounts keep an explicitly trusted origin.
  const demoOrigin = process.env.DEMO_MODE === 'true' && process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (demoOrigin ? `https://${demoOrigin}` : 'http://localhost:3000'),
  );
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash)
    throw new Error('APP_URL must be an origin');
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid APP_URL protocol');
  return url.origin;
}
export function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}
export function isLocal() {
  const url = new URL(appUrl());
  return (
    process.env.NODE_ENV !== 'production' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  );
}
