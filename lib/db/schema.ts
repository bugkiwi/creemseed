import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  uniqueIndex,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';

const date = (name: string) => timestamp(name, { withTimezone: true });
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('user'),
  createdAt: date('created_at').notNull().defaultNow(),
  updatedAt: date('updated_at').notNull().defaultNow(),
});
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: date('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: date('created_at').notNull().defaultNow(),
    updatedAt: date('updated_at').notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_user_idx').on(t.userId)],
);
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: date('access_token_expires_at'),
    refreshTokenExpiresAt: date('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: date('created_at').notNull().defaultNow(),
    updatedAt: date('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('account_user_idx').on(t.userId),
    uniqueIndex('account_provider_idx').on(t.providerId, t.accountId),
  ],
);
export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: date('expires_at').notNull(),
    createdAt: date('created_at').notNull().defaultNow(),
    updatedAt: date('updated_at').notNull().defaultNow(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
);
export const rateLimit = pgTable('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});
export const billingCustomers = pgTable(
  'billing_customers',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    customerId: text('customer_id').notNull(),
    environment: text('environment').notNull(),
    createdAt: date('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('customer_user_env_idx').on(t.userId, t.environment),
    uniqueIndex('customer_remote_env_idx').on(t.customerId, t.environment),
  ],
);
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    customerId: text('customer_id').notNull(),
    productId: text('product_id').notNull(),
    planKey: text('plan_key').notNull(),
    environment: text('environment').notNull(),
    status: text('status').notNull(),
    periodStart: date('period_start'),
    periodEnd: date('period_end'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    paymentVerified: boolean('payment_verified').notNull().default(false),
    trialEndsAt: date('trial_ends_at'),
    held: boolean('held').notNull().default(false),
    syncedAt: date('synced_at').notNull().defaultNow(),
  },
  (t) => [index('subscription_user_env_idx').on(t.userId, t.environment)],
);
export const checkoutAttempts = pgTable(
  'checkout_attempts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    planKey: text('plan_key').notNull(),
    productId: text('product_id').notNull(),
    environment: text('environment').notNull(),
    status: text('status').notNull().default('creating'),
    checkoutId: text('checkout_id').unique(),
    checkoutUrl: text('checkout_url'),
    createdAt: date('created_at').notNull().defaultNow(),
    updatedAt: date('updated_at').notNull().defaultNow(),
  },
  (t) => [index('checkout_user_env_idx').on(t.userId, t.environment)],
);
export const purchases = pgTable('purchases', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  customerId: text('customer_id').notNull(),
  productId: text('product_id').notNull(),
  planKey: text('plan_key').notNull(),
  transactionId: text('transaction_id').notNull().unique(),
  environment: text('environment').notNull(),
  status: text('status').notNull(),
  amountPaid: integer('amount_paid').notNull(),
  currency: text('currency').notNull(),
  createdAt: date('created_at').notNull().defaultNow(),
});
export const paymentHolds = pgTable(
  'payment_holds',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    transactionId: text('transaction_id').notNull().unique(),
    subscriptionId: text('subscription_id'),
    environment: text('environment').notNull(),
    reason: text('reason').notNull(),
    createdAt: date('created_at').notNull().defaultNow(),
  },
  (t) => [index('payment_hold_subscription_idx').on(t.subscriptionId, t.environment)],
);
export const billingEvents = pgTable(
  'billing_events',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    objectId: text('object_id').notNull(),
    relatedId: text('related_id'),
    environment: text('environment').notNull(),
    bodyHash: text('body_hash').notNull(),
    status: text('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    errorCode: text('error_code'),
    createdAt: date('created_at').notNull().defaultNow(),
    processedAt: date('processed_at'),
  },
  (t) => [index('billing_events_status_idx').on(t.status, t.createdAt)],
);
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id'),
  action: text('action').notNull(),
  targetId: text('target_id'),
  details: jsonb('details').$type<Record<string, string>>(),
  createdAt: date('created_at').notNull().defaultNow(),
});
export const mutationLimits = pgTable('mutation_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  windowStart: date('window_start').notNull(),
});
