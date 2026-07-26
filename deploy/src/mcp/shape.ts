import type { BlogPost, BlogPostCard, FaqCategory, Product } from "@/lib/content-api";
import type { FacilityCard, FacilityProfile, Place, Service } from "@/lib/directory-api";
import { blogPostUrl, facilityUrl, faqUrl, placeUrl, pricingUrl } from "@/lib/links";

/**
 * API payload -> tool result. Every function here is pure and fetches nothing, which is what makes
 * the unit suite meaningful: the shaping is the part with rules in it, and it can be exercised
 * against fixtures without a network.
 *
 * Two rules hold throughout:
 *  - every item carries its canonical www URL, so an agent can cite rather than paraphrase;
 *  - payloads are trimmed hard. Image objects collapse to a single URL and empty collections are
 *    dropped, because tokens spent on `{"width":512,"height":512}` are tokens not spent reasoning.
 */

function imageUrl(image: { url: string } | null | undefined): string | undefined {
    return image?.url ?? undefined;
}

/** Drops keys that are null, undefined or an empty array, so trimmed fields cost nothing at all. */
function compact<T extends Record<string, unknown>>(value: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(value).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && !v.length)),
    ) as Partial<T>;
}

export function shapeFacilityCard(card: FacilityCard, locale?: string) {
    return compact({
        name: card.displayName,
        companySlug: card.companySlug,
        facilitySlug: card.facilitySlug,
        city: card.cityName,
        state: card.stateName,
        country: card.countryName,
        description: card.description,
        services: card.serviceNames,
        logo: imageUrl(card.logo),
        url: facilityUrl(card.companySlug, card.facilitySlug, locale),
    });
}

export function shapeFacilityProfile(profile: FacilityProfile, locale?: string) {
    return compact({
        ...shapeFacilityCard(profile, locale),
        website: profile.companyDomain,
        productionTypes: profile.productionTypes,
        editSuites: compactCounts(profile.numEditSuitesOnline, profile.numEditSuitesOffline),
        addresses: profile.addresses.map((address) =>
            compact({
                name: address.name,
                address: address.address,
                city: address.cityName,
                state: address.state,
                postalCode: address.postalCode,
                country: address.countryName,
            }),
        ),
        spaces: profile.spaces.map((space) =>
            compact({
                name: space.name,
                description: space.description,
                seatingCapacity: space.seatingCapacity || null,
            }),
        ),
        // The creatives. `services` is what each person actually does, which is the question people
        // ask of a facility profile far more often than its address.
        creatives: profile.people.map((person) =>
            compact({
                name: person.name,
                title: person.title,
                services: person.services,
                imdbId: person.imdbId,
            }),
        ),
    });
}

function compactCounts(online: number | null, offline: number | null) {
    if (online === null && offline === null) {
        return null;
    }

    return compact({ online, offline });
}

export function shapePlace(place: Place, locale?: string) {
    return compact({
        name: place.name,
        type: place.type,
        slug: place.slug,
        numFacilities: place.numFacilities,
        parent: place.parentSlug,
        url: placeUrl(place.type, place.slug, locale),
    });
}

export function shapeService(service: Service) {
    return { uuid: service.uuid, name: service.name };
}

function matches(haystack: string | null | undefined, needle: string): boolean {
    return (haystack ?? "").toLowerCase().includes(needle);
}

/**
 * With a query, returns the matching questions *with* their answers. Without one, returns questions
 * only — the full FAQ body is a wall of text that would crowd out everything else in the context.
 */
export function shapeFaq(categories: FaqCategory[], query: string | undefined, locale?: string) {
    const needle = query?.trim().toLowerCase();

    return categories
        .map((category) => ({
            category: category.title,
            url: faqUrl(locale),
            items: category.items
                .filter((item) => !needle || matches(item.q, needle) || matches(item.a, needle))
                .map((item) => (needle ? { q: item.q, a: item.a } : { q: item.q })),
        }))
        .filter((category) => category.items.length > 0);
}

export function shapeBlogCard(post: BlogPostCard, locale?: string) {
    return compact({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        author: post.authorName,
        publishedDate: post.publishedDate,
        url: blogPostUrl(post.slug, locale),
    });
}

/**
 * Prefers the markdown body. `bodyMarkdown` only exists from the app release that added it, so an
 * older deployment still yields a readable (if noisier) post rather than an empty one.
 */
export function shapeBlogPost(post: BlogPost, locale?: string) {
    return compact({
        ...shapeBlogCard(post, locale),
        body: post.bodyMarkdown ?? post.bodyHtml,
    });
}

/** `currency` filters the price list; omitted, every currency is returned. */
export function shapeProducts(products: Product[], currency: string | undefined, locale?: string) {
    const wanted = currency?.trim().toUpperCase();

    return products.map((product) =>
        compact({
            name: product.name,
            tagline: product.tagline,
            description: product.description,
            isFree: Boolean(product.isFree),
            billingModel: product.billingModel,
            prices: (product.prices ?? [])
                .filter((price) => !wanted || price.currencyCode.toUpperCase() === wanted)
                .map((price) =>
                    compact({
                        price: price.price,
                        currency: price.currencyCode,
                        interval: price.interval,
                        intervalCount: price.intervalCount === 1 ? null : price.intervalCount,
                        trialPeriodDays: price.trialPeriodDays,
                    }),
                ),
            features: (product.displaySections ?? []).map((section) => ({
                title: section.title,
                features: section.features.map((feature) => featureText(feature)),
            })),
            url: pricingUrl(locale),
        }),
    );
}

/**
 * The display symbol carries the meaning — a feature row is "included", "not included", "unlimited"
 * or a number. Rendering it into the text is what lets a model answer "does the Pro plan include X".
 */
function featureText(feature: { symbol: string; number?: number; text: string }): string {
    switch (feature.symbol) {
        case "CHECK":
            return `✓ ${feature.text}`;
        case "X":
            return `✗ ${feature.text}`;
        case "INFINITY":
            return `Unlimited ${feature.text}`;
        case "NUMBER":
            return `${feature.number ?? 0} ${feature.text}`;
        default:
            return feature.text;
    }
}
