import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { requiredEnv } from '../lib/config';

const operation = process.argv[2];
const emailIndex = process.argv.indexOf('--email');
const email = emailIndex >= 0 ? process.argv[emailIndex + 1]?.trim().toLowerCase() : undefined;
if (
  !['grant', 'revoke'].includes(operation) ||
  !email ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
) {
  console.error('Usage: pnpm admin:grant --email you@example.com (or admin:revoke)');
  process.exit(1);
}
const client = postgres(requiredEnv('DATABASE_URL'), { max: 1 });
try {
  await client.begin(async (tx) => {
    const [user] =
      await tx`select id, email_verified from "user" where lower(email)=${email} for update`;
    if (!user || (operation === 'grant' && !user.email_verified))
      throw new Error('A verified existing account is required.');
    await tx`update "user" set role=${operation === 'grant' ? 'admin' : 'user'}, updated_at=now() where id=${user.id}`;
    await tx`delete from session where user_id=${user.id}`;
    await tx`insert into audit_logs (id, action, target_id) values (${randomUUID()}, ${`admin.${operation}.cli`}, ${user.id})`;
  });
  console.log('Role updated and existing sessions revoked. Sign in again.');
} catch (error) {
  console.error(
    error instanceof Error && error.message === 'A verified existing account is required.'
      ? error.message
      : 'Role change failed. Check the database locally.',
  );
  process.exitCode = 1;
} finally {
  await client.end();
}
