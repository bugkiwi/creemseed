import { requiredEnv } from '@/lib/config';
import { assertAppMode } from '@/lib/deployment';
import { HttpError, failure, readBody, response } from '@/lib/http';
import { verifyEvent } from '@/lib/billing/signature';
import { processEvent, recordEvent } from '@/lib/billing/events';

export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    assertAppMode();
    // No browser session or Origin check: this is a signed server-to-server route.
    const body = await readBody(request, 1_048_576);
    const secret = requiredEnv('CREEM_WEBHOOK_SECRET');
    let event;
    try {
      event = verifyEvent(body, request.headers.get('creem-signature'), secret);
    } catch {
      throw new HttpError(400, 'Invalid webhook signature or payload.');
    }
    await recordEvent(event);
    return response(await processEvent(event.id));
  } catch (error) {
    return failure(error);
  }
}
