const TOOLS: { name: string; description: string }[] = [
    { name: "search_facilities", description: "Search the vendor directory by text, place or service" },
    { name: "get_facility", description: "One vendor's full profile, including its creatives" },
    { name: "list_places", description: "Cities, states and countries with listed vendors" },
    { name: "list_services", description: "The service categories vendors are filtered by" },
    { name: "search_faq", description: "Mediawork's published FAQ" },
    { name: "list_blog_posts", description: "Published blog posts, newest first" },
    { name: "get_blog_post", description: "One post's full body, as markdown" },
    { name: "get_plans", description: "Subscription plans, what they include, and prices" },
    { name: "search / fetch", description: "Generic pair for clients that expect them" },
];

export default function Home() {
    return (
        <main
            style={{
                fontFamily: "ui-sans-serif, system-ui, sans-serif",
                maxWidth: "42rem",
                margin: "0 auto",
                padding: "3rem 1.5rem",
                lineHeight: 1.6,
            }}
        >
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Mediawork MCP server</h1>

            <p>
                Read-only access to everything <a href="https://www.mediawork.io">Mediawork</a> publishes: the directory
                of post-production facilities, distribution vendors and freelance creatives, plus our FAQ, blog, and
                subscription plans.
            </p>

            <p>Add this URL as a custom connector in any client that speaks MCP over Streamable HTTP:</p>

            <pre
                style={{
                    background: "#f4f4f5",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    overflowX: "auto",
                }}
            >
                <code>https://mcp.mediawork.io/mcp</code>
            </pre>

            <p>No authentication — everything served here is already public.</p>

            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginTop: "2rem" }}>Tools</h2>

            <ul>
                {TOOLS.map((tool) => (
                    <li key={tool.name}>
                        <code>{tool.name}</code> — {tool.description}
                    </li>
                ))}
            </ul>
        </main>
    );
}
