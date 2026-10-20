import { z } from 'zod';
import { appUrl } from './config';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export function assertOrigin(request: Request) {
  if (request.headers.get('origin') !== appUrl())
    throw new HttpError(403, 'Invalid request origin.');
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none')
    throw new HttpError(403, 'Cross-site request rejected.');
}
export async function readBody(request: Request, maxBytes = 16_384) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maxBytes) throw new HttpError(413, 'Request too large.');
      chunks.push(chunk.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString('utf8');
}
export async function jsonBody<T>(request: Request, schema: z.ZodType<T>) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new HttpError(415, 'Expected JSON.');
  try {
    return schema.parse(JSON.parse(await readBody(request)));
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'Invalid request.');
  }
}
export function response(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return response({ error: error.code }, error.status);
  // Provider errors, request bodies, URLs and authentication tokens never enter logs.
  console.error('Request failed', { code: 'internal_error' });
  return response({ error: 'The request could not be completed. Please try again later.' }, 500);
}
