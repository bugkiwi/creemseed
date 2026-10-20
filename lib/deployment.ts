import 'server-only';
import { HttpError } from '@/lib/http';

export function isDemoMode() {
  return process.env.DEMO_MODE === 'true';
}

export function assertAppMode() {
  if (isDemoMode()) {
    throw new HttpError(
      503,
      'Accounts and payments are disabled on this public demo. Deploy your own copy to enable them.',
    );
  }
}
