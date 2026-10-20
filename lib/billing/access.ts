import { requireVerifiedUser } from '@/lib/auth/session';
import { HttpError } from '@/lib/http';
import { billingState } from './service';

// Call at the server boundary of every paid operation. UI visibility is not authorization.
export async function requirePaidUser() {
  const user = await requireVerifiedUser();
  const state = await billingState(user.id);
  if (!state.hasAccess) throw new HttpError(402, 'An active paid plan is required.');
  return user;
}
