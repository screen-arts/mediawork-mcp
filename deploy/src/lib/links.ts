/**
 * Canonical www.mediawork.io URLs for everything the tools return.
 *
 * Every tool result carries one, so an agent can cite and link back rather than paraphrasing us
 * into a dead end. Pure and dependency-free so it is unit-testable without a network.
 *
 * www runs next-intl with `localePrefix: "as-needed"`, so English keeps the unprefixed URLs and
 * every other language lives under /<locale>. Getting that wrong produces a 404 for exactly one
 * language, which is the sort of thing nobody notices for months.
 */

export const WWW_URL = "https://www.mediawork.io";

export const DEFAULT_LOCALE = "en";

export type PlaceKind = "CITY" | "STATE" | "COUNTRY";

function prefix(locale: string | undefined): string {
    return !locale || locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

function url(locale: string | undefined, path: string): string {
    return `${WWW_URL}${prefix(locale)}${path}`;
}

export function facilityUrl(companySlug: string, facilitySlug: string, locale?: string): string {
    return url(locale, `/directory/${companySlug}/${facilitySlug}`);
}

export function placeUrl(kind: PlaceKind, slug: string, locale?: string): string {
    return url(locale, `/directory/${kind.toLowerCase()}/${slug}`);
}

export function directoryUrl(locale?: string): string {
    return url(locale, "/directory");
}

export function blogPostUrl(slug: string, locale?: string): string {
    return url(locale, `/blog/${slug}`);
}

export function blogUrl(locale?: string): string {
    return url(locale, "/blog");
}

export function faqUrl(locale?: string): string {
    return url(locale, "/faq");
}

// Pricing lives on the www home page rather than a page of its own.
export function pricingUrl(locale?: string): string {
    return url(locale, "/");
}
