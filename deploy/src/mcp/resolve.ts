import type { PlaceType } from "@/lib/links";

/**
 * The opaque id scheme behind the generic `search` / `fetch` pair that ChatGPT's connector mode
 * expects. One `kind:key` string identifies anything we publish:
 *
 *   facility:{companySlug}/{facilitySlug}
 *   place:{CITY|STATE|COUNTRY}/{slug}
 *   faq:{uuid}
 *   blog:{slug}
 *   plan:{uuid}
 *
 * Only the first colon separates kind from key, so a key may contain colons and slashes without
 * escaping. Parsing never throws — a malformed id from a model is an ordinary tool error, not a 500.
 */

export type ResourceId =
    | { kind: "facility"; companySlug: string; facilitySlug: string }
    | { kind: "place"; placeType: PlaceType; slug: string }
    | { kind: "faq"; uuid: string }
    | { kind: "blog"; slug: string }
    | { kind: "plan"; uuid: string };

const PLACE_TYPES: PlaceType[] = ["CITY", "STATE", "COUNTRY"];

export function facilityId(companySlug: string, facilitySlug: string): string {
    return `facility:${companySlug}/${facilitySlug}`;
}

export function placeId(placeType: PlaceType, slug: string): string {
    return `place:${placeType}/${slug}`;
}

export function faqId(uuid: string): string {
    return `faq:${uuid}`;
}

export function blogId(slug: string): string {
    return `blog:${slug}`;
}

export function planId(uuid: string): string {
    return `plan:${uuid}`;
}

export function parseResourceId(id: string): ResourceId | null {
    const separator = id.indexOf(":");

    if (separator < 1) {
        return null;
    }

    const kind = id.slice(0, separator);
    const key = id.slice(separator + 1);

    if (!key) {
        return null;
    }

    switch (kind) {
        case "facility": {
            const slash = key.indexOf("/");

            if (slash < 1 || slash === key.length - 1) {
                return null;
            }

            return { kind: "facility", companySlug: key.slice(0, slash), facilitySlug: key.slice(slash + 1) };
        }
        case "place": {
            const slash = key.indexOf("/");

            if (slash < 1 || slash === key.length - 1) {
                return null;
            }

            const placeType = key.slice(0, slash).toUpperCase() as PlaceType;

            if (!PLACE_TYPES.includes(placeType)) {
                return null;
            }

            return { kind: "place", placeType, slug: key.slice(slash + 1) };
        }
        case "faq":
            return { kind: "faq", uuid: key };
        case "blog":
            return { kind: "blog", slug: key };
        case "plan":
            return { kind: "plan", uuid: key };
        default:
            return null;
    }
}
