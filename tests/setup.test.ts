import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, access, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateSettings, validateOrigin } from '../scripts/setup-schema.mjs';
import config from '../starter.config.json';

test('setup requires explicit valid public scenario choices and excludes secret fields', () => {
  assert.deepEqual(validateSettings(config), config);
  for (const value of [
    { ...config, secret: 'do-not-commit' },
    { ...config, auth: [] },
    { ...config, auth: ['email', 'email'] },
    { ...config, auth: ['unknown'] },
    { ...config, billing: 'metered' },
    { ...config, name: 'name\nINJECTED=value' },
    { ...config, analytics: { posthog: false } },
  ])
    assert.throws(() => validateSettings(value));
  assert.equal(validateOrigin('http://localhost:3000'), 'http://localhost:3000');
  assert.equal(validateOrigin('https://app.example.com'), 'https://app.example.com');
  for (const url of [
    'https://user:secret@app.example.com',
    'https://app.example.com/auth',
    'https://app.example.com?token=x',
    'http://app.example.com',
    'file:///tmp/a',
  ])
    assert.throws(() => validateOrigin(url));
});
test('create CLI excludes local state, generates fresh secrets and preserves existing env', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'creemseed-create-'));
  try {
    const target = path.join(directory, 'new-app'),
      settings = path.join(directory, 'choices.json');
    await writeFile(
      settings,
      JSON.stringify({ ...config, database: 'existing', name: 'Fixture App' }),
    );
    const result = spawnSync(
      process.execPath,
      ['bin/create.mjs', target, '--config', settings, '--yes', '--skip-install', '--skip-db'],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    assert.equal(result.status, 0, 'create must succeed');
    assert.equal(
      JSON.parse(await readFile(path.join(target, 'package.json'), 'utf8')).name,
      'fixture-app',
    );
    for (const excluded of ['.git', 'node_modules', '.local', '.next'])
      await assert.rejects(access(path.join(target, excluded)));
    const original = await readFile(path.join(target, '.env'), 'utf8');
    assert.match(original, /BILLING_ENABLED=false/);
    assert.match(original, /CREEM_ENVIRONMENT=test/);
    assert.match(original, /BETTER_AUTH_SECRET=[A-Za-z0-9_-]{64}/);
    const second = spawnSync(
      process.execPath,
      [
        path.join(target, 'scripts/setup.mjs'),
        '--config',
        settings,
        '--yes',
        '--skip-install',
        '--skip-db',
      ],
      { encoding: 'utf8' },
    );
    assert.equal(second.status, 0);
    assert.equal(await readFile(path.join(target, '.env'), 'utf8'), original);
    const collision = spawnSync(process.execPath, ['bin/create.mjs', target], { encoding: 'utf8' });
    assert.notEqual(collision.status, 0, 'existing project cannot be overwritten');
    const missingChoices = spawnSync(process.execPath, ['scripts/setup.mjs', '--yes'], {
      encoding: 'utf8',
    });
    assert.notEqual(
      missingChoices.status,
      0,
      'unattended setup must have explicit scenario choices',
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
