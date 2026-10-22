import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { isConfiguredAdminEmail } from './admin-emails';
import { db } from '@/lib/db';
import { auditLogs, user } from '@/lib/db/schema';

export type AdminCandidate = Pick<
  typeof user.$inferSelect,
  'id' | 'name' | 'email' | 'emailVerified' | 'role'
>;

const userFields = {
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  role: user.role,
};

export async function provisionConfiguredAdmin(account: AdminCandidate) {
  if (account.role === 'admin' || !account.emailVerified || !isConfiguredAdminEmail(account.email))
    return account;

  return db.transaction(async (tx) => {
    const [promoted] = await tx
      .update(user)
      .set({ role: 'admin', updatedAt: new Date() })
      .where(
        and(
          eq(user.id, account.id),
          eq(user.email, account.email),
          eq(user.emailVerified, true),
          eq(user.role, 'user'),
        ),
      )
      .returning(userFields);

    if (promoted) {
      await tx.insert(auditLogs).values({
        id: randomUUID(),
        action: 'admin.grant.env',
        targetId: account.id,
        details: { source: 'ADMIN_EMAILS' },
      });
      return promoted;
    }

    const [current] = await tx
      .select(userFields)
      .from(user)
      .where(eq(user.id, account.id))
      .limit(1);
    return current ?? null;
  });
}
