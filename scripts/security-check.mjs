import { readdir, readFile, lstat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', '.next', 'node_modules', '.local', '.vercel', 'coverage']);
async function collect(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (
      ignored.has(item.name) ||
      item.name.endsWith('.tsbuildinfo') ||
      item.name === 'next-env.d.ts' ||
      (item.name.startsWith('.env') && item.name !== '.env.example')
    )
      continue;
    const absolute = path.join(directory, item.name);
    if (item.isSymbolicLink())
      throw new Error('Source contains a symbolic link; review it before publishing.');
    if (item.isDirectory()) files.push(...(await collect(absolute)));
    else files.push(path.relative(root, absolute));
  }
  return files;
}
const errors = [];
const patterns = [
  /-{5}BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-{5}/,
  /\bcreem_(?:test_)?[A-Za-z0-9]{20,}\b/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{50,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bre_[A-Za-z0-9]{28,}\b/,
];
try {
  const tracked = spawnSync('git', ['ls-files', '-z', '--cached'], { cwd: root, encoding: 'utf8' });
  if (tracked.status === 0) {
    for (const file of tracked.stdout.split('\0').filter(Boolean)) {
      const parts = file.split('/');
      if (
        parts.some(
          (part) =>
            (/^\.env(?:\.|$)/.test(part) && part !== '.env.example') ||
            ['.local', '.vercel', 'node_modules', '.next'].includes(part),
        ) ||
        /\.(?:pem|key|p12|pfx|dump|sqlite|mp4|mov)$/i.test(file)
      )
        errors.push(`${file}: private/generated file is tracked`);
    }
  }
  const files = await collect(root);
  for (const file of files) {
    const absolute = path.join(root, file);
    const stat = await lstat(absolute);
    if (stat.size > 2_000_000) {
      errors.push(`${file}: unexpectedly large template file`);
      continue;
    }
    if (
      !/\.(?:[cm]?[jt]sx?|json|md|ya?ml|sql|svg|css|example)$/.test(file) &&
      !['LICENSE', 'NOTICE', 'Dockerfile', '.gitignore', '.dockerignore'].includes(file)
    )
      continue;
    const contents = await readFile(absolute, 'utf8');
    if (patterns.some((pattern) => pattern.test(contents)))
      errors.push(`${file}: possible credential; inspect locally`);
  }
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else
    console.log(
      `Public-file guard passed (${files.length} source files). Use a full secret scanner before publication.`,
    );
} catch {
  console.error(
    'Public-file guard could not complete. Inspect source links and repository state locally.',
  );
  process.exitCode = 1;
}
