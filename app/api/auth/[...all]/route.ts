import { getAuth } from '@/lib/auth';
import { failure, readBody } from '@/lib/http';

export const runtime = 'nodejs';
export async function GET(request: Request) {
  try {
    return await getAuth().handler(request);
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const body = await readBody(request, 65_536);
    return await getAuth().handler(
      new Request(request.url, { method: 'POST', headers: request.headers, body }),
    );
  } catch (error) {
    return failure(error);
  }
}
