import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { requiredEnv } from '../lib/config';

// Prefer a direct/unpooled endpoint for session-level advisory locks. Runtime
// traffic can continue using the pooled DATABASE_URL.
const client = postgres(process.env.MIGRATION_DATABASE_URL?.trim() || requiredEnv('DATABASE_URL'), {
  max: 1,
  prepare: false,
  onnotice: () => {},
});
try {
  // Migrations are serialized across deployment processes on this connection.
  await client`select pg_advisory_lock(738129405)`;
  await migrate(drizzle(client), {
    migrationsFolder: new URL('../lib/db/migrations', import.meta.url).pathname,
  });
  console.log('Database migrations applied.');
} catch {
  console.error('Migration failed. Check database access and migration history locally.');
  process.exitCode = 1;
} finally {
  await client`select pg_advisory_unlock(738129405)`.catch(() => {});
  await client.end();
}
