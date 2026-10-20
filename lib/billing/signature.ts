import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const eventSchema = z.object({
  id: z.string().regex(/^evt_[a-zA-Z0-9]+$/),
  eventType: z.string().min(1).max(100),
  object: z.object({
    id: z.string().min(1).max(200),
    transaction: z.union([z.string(), z.object({ id: z.string() })]).nullish(),
  }),
});
export function verifyEvent(body: string, signature: string | null, secret: string) {
  if (!secret || !signature || !/^[a-fA-F0-9]{64}$/.test(signature))
    throw new Error('Invalid webhook signature');
  const expected = createHmac('sha256', secret).update(body).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex')))
    throw new Error('Invalid webhook signature');
  const event = eventSchema.parse(JSON.parse(body));
  const transaction = event.object.transaction;
  return {
    id: event.id,
    type: event.eventType,
    objectId: event.object.id,
    relatedId: typeof transaction === 'string' ? transaction : (transaction?.id ?? null),
    bodyHash: createHash('sha256').update(body).digest('hex'),
  };
}
