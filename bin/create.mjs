#!/usr/bin/env node
import { cp, mkdir, readdir, access, realpath, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [target, ...args] = process.argv.slice(2);
if (!target || target.startsWith('--')) {
  console.log(
    'Usage: node bin/create.mjs <target-directory> [setup options]\nExample: node bin/create.mjs ../my-app\nFor AI setup: add --config /absolute/path/to/settings.json --yes',
  );
  process.exit(target === '--help' ? 0 : 1);
}
const destination = path.resolve(target);
try {
  if (destination === root || destination.startsWith(root + path.sep))
    throw new Error('Choose a destination outside the template.');
  try {
    if ((await readdir(destination)).length) throw new Error('Destination must be empty.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(destination, { recursive: true });
  const resolved = await realpath(destination);
  if (resolved === root || resolved.startsWith(root + path.sep))
    throw new Error('Destination resolves inside the template.');
  // An allowlist prevents local credentials, databases, build output and Git
  // history from ever being copied into a generated public project.
  const entries = [
    'app',
    'components',
    'lib',
    'scripts',
    'bin',
    'docs',
    'prompts',
    'public',
    '.github',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'starter.config.json',
    'tsconfig.json',
    'next.config.ts',
    'postcss.config.mjs',
    'drizzle.config.ts',
    'components.json',
    'compose.yaml',
    'Dockerfile',
    '.dockerignore',
    '.gitignore',
    '.prettierrc.json',
    '.prettierignore',
    '.env.example',
    'README.md',
    'README.zh-CN.md',
    'LICENSE',
    'NOTICE',
    'AGENTS.md',
    'SECURITY.md',
    'CONTRIBUTING.md',
    'tests',
  ];
  for (const entry of entries) {
    try {
      await access(path.join(root, entry));
    } catch {
      continue;
    }
    await cp(path.join(root, entry), path.join(destination, entry), {
      recursive: true,
      errorOnExist: true,
      force: false,
      dereference: false,
      filter: async (source) => {
        if ((await lstat(source)).isSymbolicLink())
          throw new Error('Template source links are not copied.');
        return !path
          .relative(root, source)
          .split(path.sep)
          .some(
            (part) =>
              ['.git', '.local', '.next', '.vercel', 'node_modules', '.DS_Store'].includes(part) ||
              (part.startsWith('.env') && part !== '.env.example') ||
              /\.(?:pem|key|p12|pfx|dump|sqlite3?|log|mp4|mov|tsbuildinfo)$/i.test(part),
          );
      },
    });
  }
  console.log(`Created ${destination}. No credentials or Git history were copied.`);
  const result = spawnSync(
    process.execPath,
    [path.join(destination, 'scripts/setup.mjs'), ...args],
    { cwd: destination, stdio: 'inherit', shell: false },
  );
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(`Create stopped: ${error.message}`);
  process.exitCode = 1;
}
