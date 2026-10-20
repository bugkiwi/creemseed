export function validateSettings(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Configuration must be an object.');
  const keys = [
    'version',
    'name',
    'description',
    'database',
    'auth',
    'email',
    'billing',
    'analytics',
    'deployment',
  ];
  if (Object.keys(value).some((key) => !keys.includes(key)) || keys.some((key) => !(key in value)))
    throw new Error(
      'Use the complete public configuration schema. Do not put secrets in this file.',
    );
  if (
    value.version !== 1 ||
    typeof value.name !== 'string' ||
    value.name.trim().length < 1 ||
    value.name.length > 60 ||
    /[\r\n\x00-\x1f]/.test(value.name)
  )
    throw new Error('Invalid project name.');
  if (typeof value.description !== 'string' || value.description.length > 240)
    throw new Error('Description must be at most 240 characters.');
  for (const [key, allowed] of Object.entries({
    database: ['docker', 'existing'],
    email: ['console', 'resend'],
    billing: ['subscriptions', 'onetime', 'hybrid'],
    deployment: ['vercel', 'node'],
  })) {
    if (!allowed.includes(value[key])) throw new Error(`Invalid ${key} option.`);
  }
  if (
    !Array.isArray(value.auth) ||
    !value.auth.length ||
    value.auth.some((provider) => !['email', 'google', 'github'].includes(provider)) ||
    new Set(value.auth).size !== value.auth.length
  )
    throw new Error('Choose email, google and/or github authentication.');
  if (
    !value.analytics ||
    Object.keys(value.analytics).sort().join(',') !== 'posthog,speedInsights,vercel' ||
    Object.values(value.analytics).some((flag) => typeof flag !== 'boolean')
  )
    throw new Error('Choose explicit booleans for all analytics services.');
  return value;
}
export function validateOrigin(value) {
  const url = new URL(value);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.pathname !== '/' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('The application URL must be an HTTP(S) origin.');
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    throw new Error('Public application URLs require HTTPS.');
  return url.origin;
}
