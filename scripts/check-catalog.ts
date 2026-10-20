import 'dotenv/config';
import { enabledPlans } from '../lib/billing/plans';
import { assertProduct, environment, gateway } from '../lib/billing/creem';
import { requiredEnv } from '../lib/config';
try {
  const mode = environment();
  for (const plan of enabledPlans()) {
    assertProduct(await gateway.product(requiredEnv(plan.productEnv)), plan);
    console.log(`${plan.key}: valid (${mode})`);
  }
} catch {
  console.error(
    'Catalog check failed. Verify environment, API permissions, product IDs, currency, tax mode, cadence, and configured prices.',
  );
  process.exitCode = 1;
}
