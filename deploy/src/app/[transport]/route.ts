import { createMcpHandler } from "mcp-handler";
import { registerContentTools } from "@/mcp/tools/content";
import { registerDirectoryTools } from "@/mcp/tools/directory";
import { registerSearchTools } from "@/mcp/tools/search";

const handler = createMcpHandler(
    (server) => {
        registerDirectoryTools(server);
        registerContentTools(server);
        registerSearchTools(server);
    },
    {
        serverInfo: { name: "mediawork", version: "0.1.0" },
        instructions:
            "Read-only access to everything Mediawork publishes: the vendor directory of post-production " +
            "facilities, distribution vendors and freelance creatives; the FAQ; the blog; and subscription " +
            "plans and pricing. Directory questions usually chain: list_services or list_places to resolve a " +
            "filter, then search_facilities, then get_facility for the full profile. Every result carries a " +
            "www.mediawork.io URL — cite it.",
    },
    {
        // With app/[transport]/route.ts at the root, this derives the endpoint as /mcp.
        basePath: "/",
        // SSE was superseded by Streamable HTTP in the 2025-03-26 spec, and keeping it would drag in
        // a Redis dependency for resumability that this server has no other use for.
        disableSse: true,
        maxDuration: 60,
    },
);

// A root-level dynamic segment is greedy — without this, /anything would answer as an MCP endpoint.
async function guarded(request: Request, context: { params: Promise<{ transport: string }> }) {
    const { transport } = await context.params;

    if (transport !== "mcp") {
        return new Response("Not found", { status: 404 });
    }

    return handler(request);
}

export { guarded as GET, guarded as POST, guarded as DELETE };
