# Mediawork MCP server

Read-only [Model Context Protocol](https://modelcontextprotocol.io) access to everything
[Mediawork](https://www.mediawork.io) publishes publicly: the directory of post-production and
distribution vendors, the FAQ, the blog, and subscription plans.

**Connector URL: `https://mcp.mediawork.io/mcp`** — Streamable HTTP, no authentication, no sign-up.

Listed in the official MCP Registry as `io.mediawork/mediawork`.

## Connect it

Claude Code:

```sh
claude mcp add --transport http mediawork https://mcp.mediawork.io/mcp
```

Anything that takes a JSON config:

```json
{
    "mcpServers": {
        "mediawork": {
            "type": "http",
            "url": "https://mcp.mediawork.io/mcp"
        }
    }
}
```

## Tools

| Tool | What it does |
| --- | --- |
| `search` | One query across the directory, FAQ and blog, returning `{id, title, url}` |
| `fetch` | Read one record in full, by an `id` from `search` |
| `search_facilities` | The vendor directory, filtered by service and place |
| `get_facility` | A vendor's full public profile |
| `list_services` | The service taxonomy, for resolving a filter |
| `list_places` | Cities, states and countries with vendors in them |
| `search_faq` | Published FAQ entries |
| `list_blog_posts` / `get_blog_post` | The blog |
| `get_plans` | Subscription plans and pricing |

`search` + `fetch` are the generic pair some clients require; the dedicated tools give richer,
filterable results where a client can use them.

Directory questions usually chain: `list_services` or `list_places` to resolve a filter, then
`search_facilities`, then `get_facility`. Every result carries its canonical `www.mediawork.io` URL
so an agent can cite the source.

## Read-only, structurally

The deployment holds exactly one environment variable, `APP_API_URL`, and every byte it serves comes
from `https://app.mediawork.io/api/www/*` — the same public contract the marketing site consumes.
There are no database credentials and no write path, so "read-only" is a property of the
deployment's shape rather than a promise in a comment.

## Develop

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
