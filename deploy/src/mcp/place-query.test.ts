import { describe, expect, it } from "vitest";
import type { Place } from "@/lib/directory-api";
import { matchPlaceQuery } from "@/mcp/place-query";

const place = (type: Place["type"], slug: string, name: string, numFacilities = 5): Place => ({
    type,
    slug,
    name,
    numFacilities,
    parentType: null,
    parentSlug: null,
});

const places: Place[] = [
    place("CITY", "london", "London", 11),
    place("STATE", "england", "England", 15),
    place("COUNTRY", "united-kingdom", "United Kingdom", 15),
    place("CITY", "new-york", "New York", 8),
    place("STATE", "new-york", "New York", 12),
    place("CITY", "chiang-rai", "Chiang Rai", 2),
];

describe("matchPlaceQuery", () => {
    it("matches a place by name, case-insensitively", () => {
        expect(matchPlaceQuery(places, "London")?.slug).toBe("london");
        expect(matchPlaceQuery(places, "london")?.slug).toBe("london");
        expect(matchPlaceQuery(places, "  LONDON  ")?.slug).toBe("london");
    });

    it("matches a place by slug", () => {
        expect(matchPlaceQuery(places, "united-kingdom")?.slug).toBe("united-kingdom");
    });

    // "Chiang Rai" typed naturally should find the chiang-rai place.
    it("slugifies a multi-word query", () => {
        expect(matchPlaceQuery(places, "Chiang Rai")?.slug).toBe("chiang-rai");
        expect(matchPlaceQuery(places, "New York")?.name).toBe("New York");
    });

    // Someone naming a city means that city; the state page is a click away either way.
    it("prefers the narrower place when a name is both a city and a state", () => {
        expect(matchPlaceQuery(places, "New York")?.type).toBe("CITY");
    });

    // A substring rule would drag "london post" onto London and silently drop "post" — worse than
    // falling through to the ordinary facility-name search.
    it("does not match on a substring", () => {
        expect(matchPlaceQuery(places, "london post")).toBeNull();
        expect(matchPlaceQuery(places, "lond")).toBeNull();
        expect(matchPlaceQuery(places, "sound post")).toBeNull();
    });

    it("returns null for an empty or absent query", () => {
        expect(matchPlaceQuery(places, undefined)).toBeNull();
        expect(matchPlaceQuery(places, "")).toBeNull();
        expect(matchPlaceQuery(places, "   ")).toBeNull();
    });

    it("returns null when nothing matches", () => {
        expect(matchPlaceQuery(places, "Reykjavik")).toBeNull();
        expect(matchPlaceQuery([], "London")).toBeNull();
    });
});
