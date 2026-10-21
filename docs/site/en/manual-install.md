# Manual and CLI installation

Use this path when you want to choose the application setup yourself and run the setup script locally. The interactive wizard asks you to make product-specific choices before it changes project files.

## 1. Create your repository

Choose **Use this template** on [GitHub](https://github.com/bugkiwi/creemseed/generate) to create your own repository. Clone your copy and enter the project directory:

```sh
git clone https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

Or clone the source to evaluate the starter before creating your own copy:

```sh
git clone https://github.com/bugkiwi/creemseed.git
cd creemseed
```

## 2. Install prerequisites

- Node.js **22.18 or newer in the 22 line**, or Node.js 24.
- pnpm **12.4.2**, as pinned in `package.json`.
- Docker Desktop or Docker Engine only if you choose local Docker Postgres.

## 3. Run the interactive installer

```sh
node scripts/setup.mjs
```

The wizard asks you to choose:

| Setting   | Choices                                                                      |
| --------- | ---------------------------------------------------------------------------- |
| Project   | Name, short description and app origin                                       |
| Database  | Local Docker Postgres or an existing private Postgres database               |
| Sign-in   | Email/password, Google, GitHub, or a supported combination                   |
| Email     | Local console output or Resend                                               |
| Billing   | Subscriptions, subscriptions plus one-time, or one-time only                 |
| Analytics | Disabled, or any combination of PostHog, Vercel Analytics and Speed Insights |
| Hosting   | Vercel or standalone Node/Docker                                             |

The wizard installs dependencies, updates `starter.config.json`, writes fresh local settings to the ignored `.env`, and can start and migrate a local Postgres container. It preserves an existing `.env`. It does not create provider accounts, add secret values for you, create an administrator, or enable Live payments.

## 4. Add provider credentials locally

Open `.env` in a local editor and fill only the values needed for the choices you made. Keep this file out of Git. For an existing Postgres database, replace the `DATABASE_URL` placeholder with its private connection URL before migrating.

The [environment guide](/docs/environment) explains where each value comes from, how to register OAuth callbacks, how to set up Resend and Creem, and which variables Vercel provides. The installer starts with Creem Test mode and billing disabled. Follow the [Creem guide](/docs/creem) before testing checkout.

## 5. Start the application

```sh
pnpm dev
```

For local Docker Postgres, the setup script starts the database and applies committed migrations. If you selected an existing database or skipped database setup, fill in `DATABASE_URL` and run:

```sh
pnpm db:migrate
```

Then validate the selected configuration:

```sh
pnpm env:check
```

## Non-interactive CLI and creating another copy

For automation, prepare an explicit secret-free JSON file following [`docs/setup.md`](https://github.com/bugkiwi/creemseed/blob/main/docs/setup.md#explicit-unattended-configuration). The script rejects incomplete or unexpected settings; `--yes` does not pick your use case for you.

```sh
node scripts/setup.mjs --config /absolute/path/to/choices.json --yes \
  --url http://localhost:3000
```

To copy this checkout into a new empty directory and run setup there:

```sh
node bin/create.mjs ../my-app
```

This command copies only the template's allowlisted project files. It refuses a non-empty destination and does not copy `.env`, Git history, dependencies, build output or local assets. You can pass setup options after the destination; see `node bin/create.mjs --help`.

## Before deploying

Create your own database and provider apps, use separate secrets for local, Preview and Production, and test with Creem Test credentials first. Do not enable Live billing until you have verified checkout, signed webhooks, trial access, cancellation and account access in your own deployment. Continue with [Vercel deployment](/docs/vercel).
