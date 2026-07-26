import "server-only";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getBlogPost, getBlogPosts, getFaq, getProducts } from "@/lib/content-api";
import { getFacility, getPlaces, searchFacilities } from "@/lib/directory-api";
import { blogPostUrl, facilityUrl, faqUrl, placeUrl, pricingUrl } from "@/lib/links";
import { matchPlaceQuery } from "@/mcp/place-query";
import { blogId, facilityId, faqId, parseResourceId, placeId, planId } from "@/mcp/resolve";
import { shapeBlogPost, shapeFacilityCard, shapeFacilityProfile, shapeProducts } from "@/mcp/shape";
import { json, notFound } from "@/mcp/tools/common";

/**
 * The generic pair ChatGPT's deep-research connector mode requires: `search` returns
 * {id, title, url} rows, and `fetch` resolves one id to its content. Everything here is a thin
 * dispatcher over the same client functions the typed tools use — no extra data access, no second
 * cache. Clients that support the typed tools should prefer them; these exist for the ones that
 * don't.
 */

type SearchResult = { id: string; title: string; url: string };

export function registerSearchTools(server: McpServer) {
    server.registerTool(
        "search",
        {
            title: "Search Mediawork",
            description:
                "Search everything Mediawork publishes — vendor directory listings, FAQ entries and blog posts — " +
                "and return matching records as {id, title, url}. Pass an `id` to `fetch` to read one in full. " +
                "If your client supports them, the dedicated tools (search_facilities, search_faq, …) give " +
                "richer, filterable results.",
            inputSchema: { query: z.string().describe("What to search for") },
        },
        async ({ query }) => json({ results: await searchEverything(query) }),
    );

    server.registerTool(
        "fetch",
        {
            title: "Fetch a Mediawork record",
            description: "Retrieve the full contents of one record by the `id` returned from `search`.",
            inputSchema: { id: z.string().describe("An id from a search result") },
        },
        async ({ id }) => {
            const document = await fetchById(id);

            if (!document) {
                return notFound(`No record for id "${id}"`);
            }

            return json(document);
        },
    );
}

async function searchEverything(query: string): Promise<SearchResult[]> {
    const needle = query.trim().toLowerCase();

    // Fanned out rather than sequential: each source is an independent cached fetch, so the slowest
    // one sets the latency instead of the sum.
    const [faq, posts, places, products] = await Promise.all([
        getFaq(),
        getBlogPosts(),
        getPlaces(),
        getProducts(),
    ]);

    // Same place-naming trap as search_facilities: "london" matches no facility *name*, so without
    // this a search for a city returns the place row and none of the vendors in it.
    const resolvedPlace = matchPlaceQuery(places, query);

    const facilities = await searchFacilities(
        resolvedPlace ? { placeSlug: resolvedPlace.slug } : { query },
    );

    const facilityResults = facilities.facilities.map((facility) => ({
        id: facilityId(facility.companySlug, facility.facilitySlug),
        title: facility.displayName,
        url: facilityUrl(facility.companySlug, facility.facilitySlug),
    }));

    const faqResults = faq.flatMap((category) =>
        category.items
            .filter((item) => contains(item.q, needle) || contains(item.a, needle))
            .map((item) => ({ id: faqId(item.uuid), title: item.q, url: faqUrl() })),
    );

    const postResults = posts
        .filter((post) => contains(post.title, needle) || contains(post.excerpt, needle))
        .map((post) => ({ id: blogId(post.slug), title: post.title, url: blogPostUrl(post.slug) }));

    const placeResults = places
        .filter((place) => contains(place.name, needle))
        .map((place) => ({
            id: placeId(place.type, place.slug),
            title: `${place.name} — ${place.numFacilities} vendors`,
            url: placeUrl(place.type, place.slug),
        }));

    const planResults = products
        .filter((product) => contains(product.name, needle) || contains(product.tagline, needle))
        .map((product) => ({
            id: planId(product.uuid),
            title: product.name ?? "Plan",
            url: pricingUrl(),
        }));

    // Interleaved rather than concatenated: a client that truncates to the first N results should
    // still see every kind of record, not twenty-four facilities and nothing else.
    return interleave([facilityResults, faqResults, postResults, placeResults, planResults]);
}

function contains(haystack: string | null | undefined, needle: string): boolean {
    return (haystack ?? "").toLowerCase().includes(needle);
}

function interleave<T>(groups: T[][]): T[] {
    const longest = Math.max(0, ...groups.map((group) => group.length));
    const merged: T[] = [];

    for (let index = 0; index < longest; index += 1) {
        for (const group of groups) {
            if (index < group.length) {
                merged.push(group[index]);
            }
        }
    }

    return merged;
}

async function fetchById(id: string) {
    const parsed = parseResourceId(id);

    if (!parsed) {
        return null;
    }

    switch (parsed.kind) {
        case "facility": {
            const profile = await getFacility(parsed.companySlug, parsed.facilitySlug);

            return profile
                ? {
                      id,
                      title: profile.displayName,
                      url: facilityUrl(profile.companySlug, profile.facilitySlug),
                      text: JSON.stringify(shapeFacilityProfile(profile), null, 2),
                  }
                : null;
        }
        case "place": {
            const place = (await getPlaces()).find(
                (candidate) => candidate.type === parsed.placeType && candidate.slug === parsed.slug,
            );

            if (!place) {
                return null;
            }

            const list = await searchFacilities({ placeSlug: place.slug });

            return {
                id,
                title: place.name,
                url: placeUrl(place.type, place.slug),
                text: JSON.stringify(
                    {
                        place: place.name,
                        numFacilities: place.numFacilities,
                        vendors: list.facilities.map((facility) => shapeFacilityCard(facility)),
                    },
                    null,
                    2,
                ),
            };
        }
        case "faq": {
            const item = (await getFaq()).flatMap((category) => category.items).find((row) => row.uuid === parsed.uuid);

            return item ? { id, title: item.q, url: faqUrl(), text: item.a } : null;
        }
        case "blog": {
            const post = await getBlogPost(parsed.slug);

            return post
                ? { id, title: post.title, url: blogPostUrl(post.slug), text: JSON.stringify(shapeBlogPost(post)) }
                : null;
        }
        case "plan": {
            const products = await getProducts();
            const index = products.findIndex((product) => product.uuid === parsed.uuid);

            if (index < 0) {
                return null;
            }

            return {
                id,
                title: products[index].name ?? "Plan",
                url: pricingUrl(),
                text: JSON.stringify(shapeProducts([products[index]], undefined)[0], null, 2),
            };
        }
    }
}
