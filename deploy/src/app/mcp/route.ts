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
);

// mcp-handler's own `maxDuration` option went away in 2.x; Next's route segment config is where the
// function timeout belongs now.
export const maxDuration = 60;

export { handler as GET, handler as POST };
