import "server-only";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getBlogPost, getBlogPosts, getFaq, getProducts } from "@/lib/content-api";
import { shapeBlogCard, shapeBlogPost, shapeFaq, shapeProducts } from "@/mcp/shape";
import { json, LOCALE_ARG, notFound } from "@/mcp/tools/common";

export function registerContentTools(server: McpServer) {
    server.registerTool(
        "search_faq",
        {
            title: "Search the Mediawork FAQ",
            description:
                "Mediawork's published FAQ, grouped by category. With a query, returns matching questions and " +
                "their answers; without one, returns every question so you can pick which to search for.",
            inputSchema: {
                query: z.string().optional().describe("Matched against both questions and answers"),
                locale: LOCALE_ARG,
            },
        },
        async ({ query, locale }) => json({ faq: shapeFaq(await getFaq(locale), query, locale) }),
    );

    server.registerTool(
        "list_blog_posts",
        {
            title: "List blog posts",
            description:
                "Published posts from the Mediawork blog, newest first. Use get_blog_post with a returned `slug` " +
                "to read one in full.",
            inputSchema: { locale: LOCALE_ARG },
        },
        async ({ locale }) => json({ posts: (await getBlogPosts()).map((post) => shapeBlogCard(post, locale)) }),
    );

    server.registerTool(
        "get_blog_post",
        {
            title: "Read a blog post",
            description: "The full body of one published blog post, as markdown.",
            inputSchema: {
                slug: z.string().describe("From a list_blog_posts result"),
                locale: LOCALE_ARG,
            },
        },
        async ({ slug, locale }) => {
            const post = await getBlogPost(slug);

            if (!post) {
                return notFound(`No published blog post with the slug "${slug}"`);
            }

            return json(shapeBlogPost(post, locale));
        },
    );

    server.registerTool(
        "get_plans",
        {
            title: "Get subscription plans and pricing",
            description:
                "Mediawork's subscription plans: what each includes, and its prices. Prices are published in " +
                "several currencies — pass `currency` to return just one.",
            inputSchema: {
                currency: z.string().optional().describe("ISO currency code, e.g. USD, GBP, EUR"),
                locale: LOCALE_ARG,
            },
        },
        async ({ currency, locale }) => json({ plans: shapeProducts(await getProducts(locale), currency, locale) }),
    );
}
