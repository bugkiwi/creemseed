#!/usr/bin/env node
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { createServer } from 'node:net';
import { validateSettings, validateOrigin } from './setup-schema.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const supported = new Set([
  '--config',
  '--url',
  '--db-port',
  '--skip-install',
  '--skip-db',
  '--yes',
  '--help',
]);
for (let i = 0; i < args.length; i++) {
  if (!supported.has(args[i])) throw new Error(`Unknown option: ${args[i]}`);
  if (['--config', '--url', '--db-port'].includes(args[i])) {
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Option needs a value.');
    i++;
  }
}
if (args.includes('--help')) {
  console.log(
    'node scripts/setup.mjs [--config settings.json --yes] [--url http://localhost:3000] [--db-port 54329] [--skip-install] [--skip-db]\nNo secrets belong in the settings JSON. Existing .env files are preserved.',
  );
  process.exit(0);
}
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const exists = async (file) =>
  access(file).then(
    () => true,
    () => false,
  );
function run(command, argv) {
  const result = spawnSync(command, argv, { cwd: root, stdio: 'inherit', shell: false });
  if (result.status !== 0)
    throw new Error(
      `${command} did not finish successfully. Fix the reported issue and rerun setup; existing .env is preserved.`,
    );
}
async function availablePort(preferred) {
  for (let port = preferred; port < Math.min(preferred + 40, 65536); port++) {
    const free = await new Promise((resolve) => {
      const server = createServer();
      server.once('error', () => resolve(false));
      server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
    });
    if (free) return port;
  }
  throw new Error('No free database port found. Pass --db-port.');
}
async function main() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if ((major !== 22 && major !== 24) || (major === 22 && minor < 18))
    throw new Error('Use Node.js 22.18+ or 24.');
  console.log('\nCreemseed / a small foundation for your next product\n');
  let settings,
    origin = option('--url') || 'http://localhost:3000';
  if (option('--config'))
    settings = validateSettings(
      JSON.parse(await readFile(path.resolve(option('--config')), 'utf8')),
    );
  else {
    if (args.includes('--yes') || !process.stdin.isTTY)
      throw new Error('Non-interactive setup requires --config with explicit scenario choices.');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ask = async (label, fallback) =>
      (await rl.question(`${label} [${fallback}]: `)).trim() || fallback;
    const choose = async (label, choices, fallback = 0) => {
      console.log(`${label}\n${choices.map((choice, i) => `  ${i + 1}. ${choice}`).join('\n')}`);
      for (;;) {
        const answer = await ask('Choose', String(fallback + 1));
        const index = Number(answer) - 1;
        if (Number.isInteger(index) && choices[index]) return index;
        console.log('Choose one of the numbered options.');
      }
    };
    try {
      const name = await ask('Project name', 'My App');
      const description = await ask(
        'Short description',
        'A small foundation for your next paid product.',
      );
      origin = await ask('Application origin', origin);
      const database = ['docker', 'existing'][
        await choose('Database', [
          'Local Postgres with Docker (unique local password)',
          'Existing Postgres (set DATABASE_URL in .env)',
        ])
      ];
      const authOptions = [
        ['email'],
        ['email', 'google'],
        ['email', 'github'],
        ['email', 'google', 'github'],
        ['google'],
        ['github'],
        ['google', 'github'],
      ];
      const auth =
        authOptions[
          await choose('Sign-in methods', [
            'Email/password',
            'Email + Google',
            'Email + GitHub',
            'Email + Google + GitHub',
            'Google only',
            'GitHub only',
            'Google + GitHub (no password)',
          ])
        ];
      const email = ['console', 'resend'][
        await choose('Transactional email', [
          'Console (localhost development only)',
          'Resend (required for deployed email/password auth)',
        ])
      ];
      const billing = ['subscriptions', 'hybrid', 'onetime'][
        await choose('Billing model', [
          'Subscriptions (monthly + yearly)',
          'Subscriptions + one-time purchase',
          'One-time purchases only',
        ])
      ];
      console.log(
        'Optional analytics: enter any of posthog, vercel, speedInsights, separated by commas; or none. All require visitor consent.',
      );
      const selection = (await ask('Analytics', 'none')).split(',').map((v) => v.trim());
      if (
        selection.some((v) => !['none', 'posthog', 'vercel', 'speedInsights'].includes(v)) ||
        (selection.includes('none') && selection.length > 1)
      )
        throw new Error('Invalid analytics selection.');
      const analytics = Object.fromEntries(
        ['posthog', 'vercel', 'speedInsights'].map((key) => [key, selection.includes(key)]),
      );
      const deployment = ['vercel', 'node'][
        await choose('Deployment target', ['Vercel', 'Node / Docker'])
      ];
      settings = validateSettings({
        version: 1,
        name,
        description,
        database,
        auth,
        email,
        billing,
        analytics,
        deployment,
      });
    } finally {
      rl.close();
    }
  }
  origin = validateOrigin(origin);
  await writeFile(path.join(root, 'starter.config.json'), JSON.stringify(settings, null, 2) + '\n');
  const manifestPath = path.join(root, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.name =
    settings.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'my-app';
  manifest.description = settings.description;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  const envFile = path.join(root, '.env');
  let createdEnv = false;
  if (!(await exists(envFile))) {
    const preferred = Number(option('--db-port') || 54329);
    if (!Number.isInteger(preferred) || preferred < 1024 || preferred > 65500)
      throw new Error('Invalid database port.');
    const port = settings.database === 'docker' ? await availablePort(preferred) : preferred;
    const secret = randomBytes(48).toString('base64url'),
      password = randomBytes(24).toString('base64url');
    let template = await readFile(path.join(root, '.env.example'), 'utf8');
    template = template
      .replace(/^NEXT_PUBLIC_APP_URL=.*$/m, `NEXT_PUBLIC_APP_URL=${origin}`)
      .replace(/^BETTER_AUTH_SECRET=.*$/m, `BETTER_AUTH_SECRET=${secret}`);
    if (settings.database === 'docker') {
      template = template.replace(
        /^DATABASE_URL=.*$/m,
        `DATABASE_URL=postgres://app:${password}@127.0.0.1:${port}/app`,
      );
      const project =
        path
          .basename(root)
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/^-+/, '') || 'app';
      template += `\n# Local Docker only. Do not use these credentials on public infrastructure.\nLOCAL_POSTGRES_PASSWORD=${password}\nPOSTGRES_PORT=${port}\nCOMPOSE_PROJECT_NAME=${project}-${createHash('sha256').update(root).digest('hex').slice(0, 6)}\n`;
    }
    await writeFile(envFile, template, { flag: 'wx', mode: 0o600 });
    createdEnv = true;
    console.log('Created .env with fresh local secrets. Values are not printed.');
  } else
    console.log(
      'Preserved existing .env. Update its origin or provider settings locally if your choices changed.',
    );
  if (!args.includes('--skip-install')) run('pnpm', ['install', '--frozen-lockfile']);
  if (!args.includes('--skip-db')) {
    if (settings.database === 'docker') {
      run('docker', ['compose', '--env-file', '.env', 'up', '-d', '--wait']);
      run('pnpm', ['db:migrate']);
    } else {
      const env = await readFile(envFile, 'utf8');
      if (!createdEnv && /^DATABASE_URL=(?!.*USER:PASSWORD).+/m.test(env))
        run('pnpm', ['db:migrate']);
      else
        console.log(
          'Set your existing DATABASE_URL in .env, then run pnpm db:migrate. No database was changed.',
        );
    }
  }
  console.log(
    `\nConfigured ${settings.name}: ${settings.billing}; ${settings.auth.join(', ')}; ${settings.email}; ${settings.deployment}.`,
  );
  console.log(
    settings.deployment === 'vercel'
      ? 'Deployment: import your own repository into Vercel; set TRUSTED_PROXY=vercel there. See docs/deployment.md.'
      : 'Deployment: use the standalone Dockerfile or Node output; only trust IP headers overwritten by your reverse proxy. See docs/deployment.md.',
  );
  console.log(
    'Next: add selected provider credentials locally, run pnpm env:check, then pnpm dev.\nBilling stays OFF until you configure Creem, validate the catalog, and explicitly enable it.\nFor the console email transport, open verification links from your local terminal.\nGrant admin only after creating and verifying your own account: pnpm admin:grant --email you@example.com\n',
  );
}
main().catch((error) => {
  console.error(`Setup stopped: ${error.message}`);
  process.exitCode = 1;
});
