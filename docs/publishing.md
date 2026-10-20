# Publish a GitHub template

Start a new Git repository with this project's own history. Review the files and run the checks before your first commit. `bin/create.mjs` intentionally does not copy Git history or a remote.

Before pushing:

```sh
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm security:check
pnpm audit --audit-level high
```

Inspect `git status` and the staged diff. Ensure only `.env.example` is tracked, and run Gitleaks or another complete secret scanner against the history you will publish. Never publish local databases, preview logs, environment exports or deployment project links. Rotate any secret that entered history.

Create your own public repository on GitHub and push the reviewed source. In **Settings → General**, enable **Template repository** if you want the “Use this template” workflow. Keep workflow permissions read-only. Enable private vulnerability reporting and the secret-scanning/push-protection features available for your repository. The included CI pins third-party actions and checks dependencies and Git history without production secrets.

No GitHub remote, npm package, production deployment or provider account is created automatically by the installer. A future npm launcher can wrap the same allowlisted create/setup flow once you choose the publisher and release process; the current supported installer runs from a downloaded or cloned repository.
