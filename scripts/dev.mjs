import 'dotenv/config';
import { spawn } from 'node:child_process';
const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--port', origin.port || '3000'],
  { stdio: 'inherit', env: process.env, shell: false },
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
