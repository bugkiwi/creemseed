# Setup contract

For each environment variable, provider dashboard path, and Vercel setup step, see the [environment guide](https://creemseed.vercel.app/docs) or the [English Markdown source](./environment.en.md).

Both installation paths call `scripts/setup.mjs` and `scripts/setup-schema.mjs`. There is no separate AI-generated installer with different defaults.

## Get the source

Use [bugkiwi/creemseed](https://github.com/bugkiwi/creemseed/generate) to create your own repository, or clone `https://github.com/bugkiwi/creemseed.git` as a local template. The repository is public; no npm launcher is required.

The hosted site and Deploy button use `DEMO_MODE=true` for a credential-free public preview. Normal CLI installation generates `.env` with `DEMO_MODE=false` so you can develop a full application. Keep that mode choice explicit in AI-assisted setup.

## Interactive

```sh
node scripts/setup.mjs
```

The wizard asks for name, description, application origin, database, sign-in methods, transactional email, billing model, independently selectable analytics and deployment target. It installs dependencies, prepares an ignored environment and can start/migrate local Docker Postgres. It never creates a provider account, silently switches to live payments, deploys a site or grants an administrator role.

Configure provider secrets locally after the wizard. Existing Postgres uses `.env` `DATABASE_URL`; the initial placeholder is never migrated. For a pooled runtime URL, optionally set `MIGRATION_DATABASE_URL` to the direct URL for the same database before running migrations. Console email is useful for development localhost only. A deployed password login must use Resend; social-only sign-in can use provider verification without a mail transport. Missing OAuth credentials mean that selected provider cannot start until you configure it.

## Explicit unattended configuration

Start with this secret-free file:

```json
{
  "version": 1,
  "name": "My App",
  "description": "A workspace for my customers.",
  "database": "docker",
  "auth": ["email", "google"],
  "email": "resend",
  "billing": "subscriptions",
  "analytics": { "posthog": false, "vercel": false, "speedInsights": false },
  "deployment": "vercel"
}
```

Allowed database values: `docker`, `existing`; auth providers: `email`, `google`, `github`, no duplicates and at least one; email: `console`, `resend`; billing: `subscriptions`, `hybrid`, `onetime`; deployment: `vercel`, `node`. Every analytics flag must be explicitly boolean. Unexpected keys are rejected so secrets cannot accidentally enter this file.

```sh
node scripts/setup.mjs --config /absolute/path/to/choices.json --yes \
  --url http://localhost:3000 --db-port 54329
```

`--yes` alone is not accepted. Use `--skip-install` or `--skip-db` to defer work, for example when filling in an external database URL or preparing offline configuration. The origin is a separate flag because it is an environment-specific setting; URLs containing credentials, paths, fragments or queries are rejected. Public origins require HTTPS.

## Create another application

```sh
node bin/create.mjs ../my-app --config /absolute/path/to/choices.json --yes
```

The target must be empty and outside the template. A file allowlist excludes `.git`, `.env`, `node_modules`, build output and local data. New local environment secrets are independently generated. Git initialization and remote publishing are explicit subsequent operations; no existing author history or remote is reused.

## Recovery and repeat runs

- A setup run preserves an existing `.env`; it can replace public choices in `starter.config.json`. If your selected origin, database or providers change, edit their local values yourself.
- If Docker or installation fails, fix that prerequisite and rerun. Do not delete a database volume just to retry setup.
- Running migrations requires a working local `.env` or deployment environment. The migration script serializes operations with a Postgres advisory lock.
- Local database credentials are newly generated and bound to loopback. They are not production credentials.
- Setup records `deployment` as your chosen target; follow deployment documentation for the actual release. It does not copy a live cloud configuration.
- Complete `pnpm env:check` after selected credentials are present. This checks configuration shape and duplicates, not external connectivity.
