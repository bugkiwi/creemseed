import test from 'node:test';
import assert from 'node:assert/strict';
import { isDemoMode, assertAppMode } from '../lib/deployment';
import { appUrl } from '../lib/config';

const saved = (names: string[]) => {
  const values = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  return () => {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
};

test('demo mode is explicit, cannot enable billing and never initializes authentication', async () => {
  const restore = saved(['DEMO_MODE', 'BILLING_ENABLED', 'BETTER_AUTH_SECRET']);
  try {
    process.env.DEMO_MODE = 'true';
    process.env.BILLING_ENABLED = 'true';
    delete process.env.BETTER_AUTH_SECRET;
    assert.equal(isDemoMode(), true);
    assert.throws(assertAppMode, /disabled/);
    const { getAuth } = await import('../lib/auth');
    const { assertBillingEnabled } = await import('../lib/billing/service');
    assert.throws(getAuth, /disabled/);
    assert.throws(assertBillingEnabled, /disabled/);
    process.env.DEMO_MODE = 'false';
    assert.equal(isDemoMode(), false);
    assert.doesNotThrow(assertAppMode);
    delete process.env.DEMO_MODE;
    assert.equal(isDemoMode(), false);
  } finally {
    restore();
  }
});

test('demo blocks every API family before sessions, payloads, database or provider configuration', async () => {
  const restore = saved(['DEMO_MODE', 'BETTER_AUTH_SECRET']);
  try {
    process.env.DEMO_MODE = 'true';
    delete process.env.BETTER_AUTH_SECRET;
    const auth = await import('../app/api/auth/[...all]/route');
    const billing = await import('../app/api/billing/[action]/route');
    const admin = await import('../app/api/admin/[action]/route');
    const webhook = await import('../app/api/webhooks/creem/route');
    const context = { params: Promise.resolve({ action: 'checkout' }) };
    const request = () =>
      new Request('https://example.test/api', { method: 'POST', body: 'invalid-json' });
    const responses = await Promise.all([
      auth.GET(new Request('https://example.test/api/auth/get-session')),
      auth.POST(request()),
      billing.POST(request(), context),
      admin.POST(request(), context),
      webhook.POST(request()),
    ]);
    for (const response of responses) {
      assert.equal(response.status, 503);
      assert.match((await response.json()).error, /disabled/);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
    }
  } finally {
    restore();
  }
});

test('only a demo can infer its canonical origin from trusted Vercel metadata', () => {
  const restore = saved(['DEMO_MODE', 'NEXT_PUBLIC_APP_URL', 'VERCEL_PROJECT_PRODUCTION_URL']);
  try {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'preview.example.test';
    process.env.DEMO_MODE = 'true';
    assert.equal(appUrl(), 'https://preview.example.test');
    process.env.DEMO_MODE = 'false';
    assert.equal(appUrl(), 'http://localhost:3000');
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.test';
    assert.equal(appUrl(), 'https://app.example.test');
  } finally {
    restore();
  }
});
