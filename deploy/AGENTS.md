# mcp.mediawork.io for Agents

The Mediawork MCP server: read-only Model Context Protocol access to everything the product publishes
publicly — the vendor directory, the FAQ, the blog, and subscription plans.

Connector URL: `https://mcp.mediawork.io/mcp` (Streamable HTTP, no authentication).

> Companion docs: [../../AGENTS.md](../../AGENTS.md) for repo-wide conventions, and
> `www/deploy` (separate repo) for the sibling consumer of the same app API.

## The two rules that define this project

**1. Read-only, structurally.** This deployment holds one environment variable, `APP_API_URL`. No
database credentials, no secrets, no write path to anything. Do not add a tool that mutates, and do
not add a credential that would make one possible — the guarantee is the deployment's shape, not a
promise in a code comment.

**2. It only ever wraps the app's public API.** Every byte served here comes from
`https://app.mediawork.io/api/www/*`, the same published contract the marketing site consumes. If a
tool needs data that endpoint doesn't expose, add it to the app's `/api/www` surface first — never
reach around into a database or a private route.

## Layout

```
src/lib/fetch.ts          APP_API_URL, cache tags, the one fetch wrapper
src/lib/directory-api.ts  directory endpoints + mirrored response types
src/lib/content-api.ts    FAQ, blog and products endpoints + types
src/lib/links.ts          canonical www.mediawork.io URL builders
src/mcp/shape.ts          pure payload -> tool result shapers
src/mcp/resolve.ts        the `kind:key` id scheme for search/fetch
src/mcp/tools/*.ts        tool registration, one file per group
src/app/[transport]/route.ts  the handler; guards the segment so only /mcp answers
```

**Response types are mirrored, not imported.** This is a separate deployable talking to a published
HTTP contract, exactly as `www/deploy` does. Keep the local types in step with the app's
`Www*` types by hand when the contract changes.

**Keep shaping pure.** Anything that turns an API payload into a tool result belongs in
`src/mcp/shape.ts` and must not fetch. That separation is what lets the unit suite cover the parts
with actual rules in them without a network.

## Conventions

- **Every item a tool returns carries its canonical `www.mediawork.io` URL** so an agent can cite us
  rather than paraphrase. `src/lib/links.ts` owns those; note that www uses next-intl's
  `localePrefix: "as-needed"`, so English is unprefixed and every other locale is not.
- **Trim payloads hard.** Image objects collapse to a single URL, and `compact()` drops nulls and
  empty arrays. Tokens spent on `{"width":512,"height":512}` are tokens not spent reasoning.
- **Cached for hours** (`use cache` + `cacheLife("hours")`). The app deliberately sends `no-store`
  so the consumer owns caching. www caches for *days* because the app pushes it invalidations
  (`www-revalidate.ts`); we get none, so the TTL is the whole mechanism. If that becomes too stale,
  the fix is to extend `revalidateWww` to fan out here — the cache tags already match its names.
- **Tolerate a missing endpoint.** `getServices` and `getBlogPost`'s markdown field both degrade
  rather than throw, because this project deploys independently of the app and can be running
  against an older release of it.

## Running it

```sh
nvm use 24
pnpm dev                                        # port 3004 — never 3000
APP_API_URL=http://localhost:3002 pnpm dev      # against a local app dev server
pnpm test:unit                                  # Vitest, pure logic, no network
pnpm test                                       # Playwright smoke spec, builds and serves on 3005
pnpm check                                      # types + lint
```

Ports mirror the repo's split: 3004 for dev, 3005 for the Playwright server, so a dev server and a
test run never contend.

**Pre-commit gate: lint → check → `pnpm test:unit`.** Playwright is not in the gate; run it before
deploying and whenever you touch the handler, the id scheme or a tool's shape.

## Testing notes

- `tests/mcp-smoke.spec.ts` drives the server with the real `@modelcontextprotocol/sdk` client over
  Streamable HTTP, because "can a real MCP client talk to us" is the risk worth covering.
- It runs against the **production** app API by default — the data is public and read-only, and
  there is no preview deployment of the app to point at. Assertions are therefore about shape and
  chaining rather than specific rows.
- To exercise anything that depends on an app change not yet released, point `APP_API_URL` at a
  local app dev server.

## The place-query trap

The app's free-text directory search matches facility and company **names** only, never the city —
correct for www, where the search box sits beside a separate place filter. An agent has no such
context: asked "who works in London?" it passes `query: "london"`, which matches no *name* and
returns nothing, against a place holding eleven vendors.

`matchPlaceQuery` ([src/mcp/place-query.ts](src/mcp/place-query.ts)) resolves a query that exactly
names a place into the place filter instead, in both `search_facilities` and `search`, and reports
it back as `resolvedPlace`. Matching is exact on name or slug on purpose — a substring rule would
drag "london post" onto London and silently drop the half of the query that mattered.

**Anything that changes how a query reaches the app should be checked against this**: the failure
looked like an empty directory, not a bug, and the smoke suite passed straight through it because a
well-behaved client chains `list_places` first.

## The registry listing

[../server.json](../server.json) is the manifest for the official MCP Registry, published under the
domain-verified namespace `io.mediawork/*`. It lives at `mcp/server.json` rather than in here
because it describes the *listing*, not the deployable.

```sh
cd mcp
mcp-publisher login dns --domain mediawork.io --private-key "$(…)"
mcp-publisher publish        # reads ./server.json
```

Bump `version` in `server.json` on each publish. The Ed25519 `key.pem` that proves ownership of the
namespace is gitignored and lives in 1Password — it is a credential, not a config file.

## Deployment

Its own Vercel project, root directory `mcp/deploy`, domain `mcp.mediawork.io`, **production only** —
there are no preview deployments, which is also why no Vercel Deployment Protection bypass secret is
needed. The only environment variable is `APP_API_URL`. Rate limiting is a Vercel Firewall rule on
the project; BotID is deliberately *not* applied here, because MCP clients are bots.
