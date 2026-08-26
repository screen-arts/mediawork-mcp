# Contributing

The Next.js app is in [`deploy/`](deploy/). Conventions and the traps worth knowing are in
[AGENTS.md](AGENTS.md).

```sh
cd deploy
nvm use 24
pnpm install
pnpm dev            # http://localhost:3004/mcp
pnpm check          # types + lint
pnpm test:unit      # Vitest — pure logic, no network
pnpm test           # Playwright smoke spec against a real MCP client
```

## What this server may do

It is read-only by construction, and that is the property worth protecting. The deployment holds
exactly one environment variable, `APP_API_URL`, and every byte it serves comes from
`https://app.mediawork.io/api/www/*` — the same public contract the marketing site consumes. A
change that introduces a database credential, a write path, or a second data source removes the
guarantee the README makes, so raise it as an issue before opening a pull request.

The `/api/www/*` types are mirrored by hand on this side. A change to one of those response shapes
in the app is a breaking change here — update both.
