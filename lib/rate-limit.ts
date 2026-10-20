import { sql } from 'drizzle-orm';
import { db } from './db';
import { HttpError } from './http';

export async function limitMutation(key: string, max = 10) {
  const rows = await db.execute(sql`
    insert into mutation_limits (key, count, window_start) values (${key}, 1, now())
    on conflict (key) do update set
      count = case when mutation_limits.window_start < now() - interval '1 minute' then 1 else mutation_limits.count + 1 end,
      window_start = case when mutation_limits.window_start < now() - interval '1 minute' then now() else mutation_limits.window_start end
    returning count
  `);
  if (Number(rows[0]?.count) > max)
    throw new HttpError(429, 'Too many requests. Please wait a minute.');
}
