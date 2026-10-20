import { z } from 'zod';
import { assertAppMode } from '@/lib/deployment';
import { assertOrigin, failure, HttpError, jsonBody, response } from '@/lib/http';
import { limitMutation } from '@/lib/rate-limit';
import {
  billingState,
  cancelSubscription,
  portalUrl,
  reconcileSubscription,
  startCheckout,
} from '@/lib/billing/service';
import { ref } from '@/lib/billing/creem';
import { db } from '@/lib/db';
import { syncCheckout } from '@/lib/billing/service';

export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  try {
    assertAppMode();
    const { requireVerifiedUser } = await import('@/lib/auth/session');
    assertOrigin(request);
    const user = await requireVerifiedUser();
    await limitMutation(`billing:${user.id}`);
    const { action } = await context.params;
    if (action === 'checkout') {
      const body = await jsonBody(request, z.object({ plan: z.string().max(50) }).strict());
      return response({ url: await startCheckout(user, body.plan) });
    }
    if (action === 'portal') {
      await jsonBody(request, z.object({}).strict());
      return response({ url: await portalUrl(user.id) });
    }
    if (action === 'cancel') {
      const body = await jsonBody(request, z.object({ id: ref('sub') }).strict());
      return response(await cancelSubscription(body.id, user.id));
    }
    if (action === 'reconcile') {
      await jsonBody(request, z.object({}).strict());
      const state = await billingState(user.id);
      // Bound work per request; large account catalogs should use a job queue.
      for (const attempt of state.attempts
        .filter((a) => ['open', 'uncertain', 'creating'].includes(a.status) && a.checkoutId)
        .slice(0, 1)) {
        await db.transaction((tx) => syncCheckout(tx, attempt.checkoutId!, attempt.id));
      }
      for (const sub of state.subscriptions
        .filter((s) => !['canceled', 'expired'].includes(s.status))
        .slice(0, 1))
        await reconcileSubscription(sub.id, user.id);
      return response({ success: true });
    }
    throw new HttpError(404, 'Action not found.');
  } catch (error) {
    return failure(error);
  }
}
