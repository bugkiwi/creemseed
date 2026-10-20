import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getAuth } from '.';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { HttpError } from '@/lib/http';
import { isDemoMode } from '@/lib/deployment';

export const currentUser = cache(async () => {
  if (isDemoMode()) return null;
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  // Read authoritative roles on every request, including after admin revocation.
  const [record] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  return record ?? null;
});
export async function requireUser(page = false) {
  const user = await currentUser();
  if (!user) {
    if (page) redirect('/sign-in');
    throw new HttpError(401, 'Please sign in.');
  }
  return user;
}
export async function requireVerifiedUser() {
  const user = await requireUser();
  if (!user.emailVerified) throw new HttpError(403, 'Verify your email before managing billing.');
  return user;
}
export async function requireAdmin(page = false) {
  const user = await requireUser(page);
  if (user.role !== 'admin' || !user.emailVerified) {
    if (page) redirect('/dashboard');
    throw new HttpError(403, 'Administrator access required.');
  }
  return user;
}
