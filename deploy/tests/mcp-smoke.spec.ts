import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { expect, test } from "@playwright/test";

/**
 * Drives the server with the official MCP client over Streamable HTTP, rather than hand-rolled
 * JSON-RPC — the risk worth testing is "can a real client talk to us", and only a real client
 * proves it.
 *
 * The server under test fetches the *production* app API: this data is public and read-only, and
 * there is no preview deployment of the app to point at. Assertions are therefore about shape and
 * chaining, not about specific rows, with one exception noted on the services test.
 */

const MCP_URL = "http://localhost:3005/mcp";

const EXPECTED_TOOLS = [
    "list_services",
    "list_places",
    "search_facilities",
    "get_facility",
    "search_faq",
    "list_blog_posts",
    "get_blog_post",
    "get_plans",
    "search",
    "fetch",
];

async function connect() {
    const client = new Client({ name: "mediawork-smoke", version: "0.1.0" });

    await client.connect(new StreamableHTTPClientTransport(new URL(MCP_URL)));

    return client;
}

/** Every tool answers with a single text block; this is the payload every assertion reads. */
async function callJson(client: Client, name: string, args: Record<string, unknown> = {}) {
    const result = (await client.callTool({ name, arguments: args })) as {
        isError?: boolean;
        content: { type: string; text: string }[];
    };

    expect(result.isError, `${name} returned an error: ${result.content?.[0]?.text}`).toBeFalsy();

    return JSON.parse(result.content[0].text);
}

test("initializes and advertises every tool", async () => {
    const client = await connect();

    expect(client.getServerVersion()).toMatchObject({ name: "mediawork" });

    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name).sort()).toEqual([...EXPECTED_TOOLS].sort());

    // A tool with no description is a tool a model will not reach for.
    for (const tool of tools) {
        expect(tool.description, `${tool.name} has no description`).toBeTruthy();
    }

    await client.close();
});

test("chains places into a facility search and then a full profile", async () => {
    const client = await connect();

    const { places } = await callJson(client, "list_places");

    expect(places.length).toBeGreaterThan(0);
    expect(places[0]).toMatchObject({ name: expect.any(String), slug: expect.any(String) });
    expect(places[0].url).toContain("https://www.mediawork.io/");

    const search = await callJson(client, "search_facilities", { place: places[0].slug });

    expect(search.facilities.length).toBeGreaterThan(0);

    const card = search.facilities[0];

    expect(card).toMatchObject({ companySlug: expect.any(String), facilitySlug: expect.any(String) });
    expect(card.url).toBe(`https://www.mediawork.io/directory/${card.companySlug}/${card.facilitySlug}`);

    const profile = await callJson(client, "get_facility", {
        companySlug: card.companySlug,
        facilitySlug: card.facilitySlug,
    });

    expect(profile.name).toBe(card.name);
    expect(profile.url).toBe(card.url);

    await client.close();
});

test("lists the service taxonomy the directory filters on", async () => {
    const client = await connect();

    const { services } = await callJson(client, "list_services");

    expect(Array.isArray(services)).toBe(true);

    // Tolerated empty: the /directory/services endpoint ships in a later app release than the one
    // currently deployed, and the client degrades to an unfiltered directory rather than failing.
    // Once that release is live this is a real filter, so prove the round trip when rows exist.
    if (services.length) {
        expect(services[0]).toMatchObject({ uuid: expect.any(String), name: expect.any(String) });

        const filtered = await callJson(client, "search_facilities", { service: services[0].uuid });

        expect(Array.isArray(filtered.facilities)).toBe(true);
    }

    await client.close();
});

test("returns plans, the FAQ and blog posts", async () => {
    const client = await connect();

    const { plans } = await callJson(client, "get_plans", { currency: "USD" });

    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].url).toBe("https://www.mediawork.io/");

    for (const price of plans.flatMap((plan: { prices?: { currency: string }[] }) => plan.prices ?? [])) {
        expect(price.currency).toBe("USD");
    }

    const { faq } = await callJson(client, "search_faq");

    expect(faq.length).toBeGreaterThan(0);
    // No query means questions only — the answers would swamp a context window.
    expect(faq[0].items[0]).toEqual({ q: expect.any(String) });

    const { posts } = await callJson(client, "list_blog_posts");

    expect(Array.isArray(posts)).toBe(true);

    if (posts.length) {
        const post = await callJson(client, "get_blog_post", { slug: posts[0].slug });

        expect(post.body).toBeTruthy();
        expect(post.url).toBe(`https://www.mediawork.io/blog/${posts[0].slug}`);
    }

    await client.close();
});

test("round-trips search results through fetch", async () => {
    const client = await connect();

    const { results } = await callJson(client, "search", { query: "london" });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        url: expect.stringContaining("https://www.mediawork.io/"),
    });

    const document = await callJson(client, "fetch", { id: results[0].id });

    expect(document.id).toBe(results[0].id);
    expect(document.text).toBeTruthy();

    await client.close();
});

test("reports a malformed id as a tool error, not a crash", async () => {
    const client = await connect();

    const result = (await client.callTool({ name: "fetch", arguments: { id: "not-a-real-id" } })) as {
        isError?: boolean;
        content: { text: string }[];
    };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not-a-real-id");

    await client.close();
});

test("404s any transport segment other than /mcp", async ({ request }) => {
    // The dynamic segment sits at the app root, so without the guard every path would answer here.
    expect((await request.post("/sse")).status()).toBe(404);
    expect((await request.post("/anything-else")).status()).toBe(404);
});
