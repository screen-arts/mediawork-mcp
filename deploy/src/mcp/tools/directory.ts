import "server-only";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DIRECTORY_PAGE_SIZE, getFacility, getPlaces, getServices, searchFacilities } from "@/lib/directory-api";
import { shapeFacilityCard, shapeFacilityProfile, shapePlace, shapeService } from "@/mcp/shape";
import { json, LOCALE_ARG, notFound } from "@/mcp/tools/common";

export function registerDirectoryTools(server: McpServer) {
    server.registerTool(
        "list_services",
        {
            title: "List service categories",
            description:
                "The service categories vendors on Mediawork offer, such as Editorial, Sound Post or Visual Effects. " +
                "Each has a uuid — pass it as `service` to search_facilities to filter the directory to vendors " +
                "offering that service. Call this first when a question is about a kind of work.",
            inputSchema: { locale: LOCALE_ARG },
        },
        async ({ locale }) => json({ services: (await getServices(locale)).map(shapeService) }),
    );

    server.registerTool(
        "list_places",
        {
            title: "List directory places",
            description:
                "Cities, states and countries that have at least one vendor listed, with a count of how many. " +
                "Use a place `slug` as the `place` argument to search_facilities.",
            inputSchema: { locale: LOCALE_ARG },
        },
        async ({ locale }) => json({ places: (await getPlaces()).map((place) => shapePlace(place, locale)) }),
    );

    server.registerTool(
        "search_facilities",
        {
            title: "Search the vendor directory",
            description:
                "Search publicly listed post-production facilities, distribution vendors and creative companies. " +
                "Filter by free text, by place slug (from list_places) and by service uuid (from list_services). " +
                "Results are paginated; when `hasMore` is true, call again with the returned `nextOffset`.",
            inputSchema: {
                query: z.string().optional().describe("Free text matched against facility and company names"),
                place: z.string().optional().describe("A place slug from list_places"),
                service: z.string().optional().describe("A service uuid from list_services"),
                offset: z.number().int().min(0).optional().describe("Result offset for pagination"),
                locale: LOCALE_ARG,
            },
        },
        async ({ query, place, service, offset, locale }) => {
            const list = await searchFacilities({ query, placeSlug: place, serviceUuid: service, offset });

            return json({
                facilities: list.facilities.map((facility) => shapeFacilityCard(facility, locale)),
                hasMore: list.hasMore,
                nextOffset: list.hasMore ? (offset ?? 0) + DIRECTORY_PAGE_SIZE : null,
            });
        },
    );

    server.registerTool(
        "get_facility",
        {
            title: "Get a vendor profile",
            description:
                "The full public profile for one vendor: services offered, creatives on the team and what each of " +
                "them does, production types, rooms and spaces, and addresses. Takes the `companySlug` and " +
                "`facilitySlug` pair returned by search_facilities.",
            inputSchema: {
                companySlug: z.string().describe("From a search_facilities result"),
                facilitySlug: z.string().describe("From a search_facilities result"),
                locale: LOCALE_ARG,
            },
        },
        async ({ companySlug, facilitySlug, locale }) => {
            const profile = await getFacility(companySlug, facilitySlug);

            if (!profile) {
                return notFound(`No publicly listed vendor at ${companySlug}/${facilitySlug}`);
            }

            return json(shapeFacilityProfile(profile, locale));
        },
    );
}
