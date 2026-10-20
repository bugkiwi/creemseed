import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { assertOrigin, failure, HttpError, jsonBody, response } from '@/lib/http';
import { limitMutation } from '@/lib/rate-limit';
import {
  audit,
  cancelSubscription,
  reconcileSubscription,
  syncCheckout,
} from '@/lib/billing/service';
import { processEvent } from '@/lib/billing/events';
import { ref } from '@/lib/billing/creem';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  try {
    assertOrigin(request);
    const admin = await requireAdmin();
    await limitMutation(`admin:${admin.id}`, 15);
    const { action } = await context.params;
    if (action === 'retry-event') {
      const body = await jsonBody(request, z.object({ id: ref('evt') }).strict());
      await audit(admin.id, 'webhook.retry', body.id);
      return response(await processEvent(body.id));
    }
    if (action === 'reconcile-subscription' || action === 'cancel-subscription') {
      const body = await jsonBody(request, z.object({ id: ref('sub') }).strict());
      await audit(admin.id, `admin.${action}`, body.id);
      return response(
        action === 'reconcile-subscription'
          ? await reconcileSubscription(body.id)
          : await cancelSubscription(body.id, admin.id, true),
      );
    }
    if (action === 'reconcile-checkout') {
      const body = await jsonBody(
        request,
        z.object({ attemptId: z.string().uuid(), checkoutId: ref('ch') }).strict(),
      );
      await audit(admin.id, 'checkout.reconcile', body.attemptId, { checkoutId: body.checkoutId });
      await db.transaction((tx) => syncCheckout(tx, body.checkoutId, body.attemptId));
      return response({ success: true });
    }
    throw new HttpError(404, 'Action not found.');
  } catch (error) {
    return failure(error);
  }
}
