# Creemseed documentation

Creemseed is an English-first, MIT-licensed Next.js starter for a paid web product. It combines Better Auth, Postgres, Drizzle and Creem billing with a customer workspace and an operational admin desk.

Choose a path to get started:

- [Explore the features](/docs/features)
- [Install from the command line](/docs/manual-install)
- [Install with an AI coding assistant](/docs/ai-install)
- [Configure every environment variable](/docs/environment)
- [Set up Creem products and webhooks](/docs/creem)
- [Deploy a complete app to Vercel](/docs/vercel)

The public Vercel demo is a showcase. To create your own repository, use the [GitHub template](https://github.com/bugkiwi/creemseed/generate). The Deploy button creates a separate, credential-free demo; follow the Vercel guide to turn your copy into a full application.

## Start with your use case

The installer asks you to choose the authentication providers, database, email transport, billing model, optional analytics, and deployment target. The defaults favor a complete app with monthly and annual subscriptions. You can use local Docker Postgres or connect an existing private Postgres database.

The CLI and AI setup use the same schema and setup script. They create local project configuration; they do not create third-party accounts or silently turn on live payments. Keep provider secrets in ignored `.env` files or your hosting provider's secret manager.

## Project scope

Creemseed is designed for products billed to an individual account. It includes a user-facing account area, recurring and optional one-time billing, and tools for an administrator to inspect and recover billing events. It does not include teams, seats, metered billing, or a background job platform.

Continue to [features](/docs/features) for the complete overview, or start the [manual installation](/docs/manual-install).
