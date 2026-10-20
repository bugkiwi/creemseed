import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { appUrl, isLocal, requiredEnv, site } from '@/lib/config';
import { sendAuthEmail } from '@/lib/email';

export function createAuth(configuration = site, deliver = sendAuthEmail) {
  const secret = requiredEnv('BETTER_AUTH_SECRET');
  if (secret.length < 32) throw new Error('BETTER_AUTH_SECRET must be at least 32 characters');
  return betterAuth({
    appName: configuration.name,
    baseURL: appUrl(),
    secret,
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    trustedOrigins: [appUrl()],
    emailAndPassword: {
      enabled:
        configuration.auth.includes('email') && (isLocal() || configuration.email === 'resend'),
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => deliver(user.email, url, 'reset'),
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => deliver(user.email, url, 'verify'),
    },
    socialProviders: {
      ...(configuration.auth.includes('google')
        ? {
            google: {
              clientId: requiredEnv('GOOGLE_CLIENT_ID'),
              clientSecret: requiredEnv('GOOGLE_CLIENT_SECRET'),
            },
          }
        : {}),
      ...(configuration.auth.includes('github')
        ? {
            github: {
              clientId: requiredEnv('GITHUB_CLIENT_ID'),
              clientSecret: requiredEnv('GITHUB_CLIENT_SECRET'),
            },
          }
        : {}),
    },
    account: { encryptOAuthTokens: true, accountLinking: { enabled: false } },
    user: { additionalFields: { role: { type: 'string', defaultValue: 'user', input: false } } },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60, cookieCache: { enabled: false } },
    advanced: {
      cookiePrefix: 'creemseed',
      useSecureCookies: new URL(appUrl()).protocol === 'https:',
      ipAddress: {
        ipAddressHeaders:
          process.env.TRUSTED_PROXY === 'vercel'
            ? ['x-vercel-forwarded-for']
            : process.env.TRUSTED_PROXY === 'x-real-ip'
              ? ['x-real-ip']
              : [],
      },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 30,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 3 },
        '/request-password-reset': { window: 60, max: 3 },
        '/send-verification-email': { window: 60, max: 3 },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: { ...user, role: 'user', email: user.email.toLowerCase().trim() },
          }),
        },
      },
    },
    logger: { disabled: true },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export const getAuth = () => (instance ??= createAuth());
