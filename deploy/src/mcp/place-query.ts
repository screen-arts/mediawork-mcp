import type { Place } from "@/lib/directory-api";

/**
 * Resolves a free-text query that is really a place name into the place filter.
 *
 * The app's free-text search matches facility and company *names* only, never the city — correct
 * for www, where the search box sits next to a separate place filter. An agent has no such context:
 * asked "who works in London?" it reaches for the query argument, gets nothing back, and concludes
 * there are no London vendors. (Proven: `q=london` returns 0, `place=london` returns 11.)
 *
 * Matching is deliberately exact against a place's name or slug. A substring rule would drag
 * "london post" or "sound" onto a place and silently drop the part of the query that mattered —
 * far worse than falling through to the ordinary name search.
 */

function normalise(value: string): string {
    return value.trim().toLowerCase();
}

/** "New York" and "new-york" are the same place to anyone but a string comparison. */
function slugify(value: string): string {
    return normalise(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function matchPlaceQuery(places: Place[], query: string | undefined): Place | null {
    if (!query?.trim()) {
        return null;
    }

    const name = normalise(query);
    const slug = slugify(query);

    const matches = places.filter((place) => normalise(place.name) === name || place.slug === slug);

    if (!matches.length) {
        return null;
    }

    // "New York" is both a city and a state. Prefer the narrower reading: someone naming a city
    // means that city, and the state page is a click away either way.
    const byType = { CITY: 0, STATE: 1, COUNTRY: 2 };

    return matches.sort((a, b) => byType[a.type] - byType[b.type] || b.numFacilities - a.numFacilities)[0];
}
