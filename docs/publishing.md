# Use or publish a GitHub template

The upstream source is [bugkiwi/creemseed](https://github.com/bugkiwi/creemseed), published under MIT with GitHub's template workflow enabled.

## Start your own repository

Choose [Use this template](https://github.com/bugkiwi/creemseed/generate), select your own account and repository name, and clone that new repository. This gives your project its own history and remote. To explore first, clone the upstream source and use `node bin/create.mjs ../my-app`; the create command intentionally does not copy Git history, credentials or deployment links.

The [live demo](https://creemseed.vercel.app) is a credential-free showcase. Its read-only deployment flags are separate from the complete application you configure locally. See docs/deployment.md before hosting a fork.

## Review before pushing

```sh
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm security:check
pnpm audit --audit-level high
```

Inspect `git status` and the staged diff. Ensure only `.env.example` is tracked, and run Gitleaks or another complete secret scanner against the history you will publish. Never publish local databases, preview logs, environment exports or deployment project links. Rotate any secret that entered history. Preserve LICENSE and NOTICE.

Point your new repository at its own Vercel project. `.vercel/` is ignored; the template includes only generic `vercel.json` settings and upload exclusions, with no account or project identifiers. The installer does not create GitHub repositories, deploy a site or copy another project's credentials.

In **Settings → General**, enable **Template repository** if you want others to use your fork as a template. Keep workflow permissions read-only. Enable private vulnerability reporting and the secret-scanning/push-protection features available for your repository. The included CI pins third-party actions and checks dependencies and Git history without production secrets.

A future npm launcher can wrap the same allowlisted create/setup flow once a publisher and release process are selected. The current supported installer runs from a downloaded, cloned or generated repository; no unpublished npm command is advertised.
