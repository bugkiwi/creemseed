import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const globalDb = globalThis as unknown as { sqlClient?: ReturnType<typeof postgres> };
// Lazy network connections allow the marketing site to build without a database.
const client =
  globalDb.sqlClient ??
  postgres(process.env.DATABASE_URL || 'postgres://localhost/creemseed', {
    max: 5,
    prepare: false,
    connect_timeout: 10,
  });
if (process.env.NODE_ENV !== 'production') globalDb.sqlClient = client;
export const db = drizzle(client, { schema });
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
