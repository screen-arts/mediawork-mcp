import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { APP_API_URL, bust, DIRECTORY_CACHE_TAG, getJson } from "@/lib/fetch";

/**
 * The product app's public directory API. Response types are mirrored here rather than imported —
 * this is a separate deployable talking to a published contract over HTTP, exactly as www/deploy
 * does.
 *
 * Cached for hours: the app deliberately sends `no-store` so the consumer owns caching, and without
 * one every agent question would be a cold database hit. www gets active invalidation pushes from
 * the app and so can cache for days; we get none, so the TTL is the whole mechanism.
 */

export type PlaceKind = "CITY" | "STATE" | "COUNTRY";

export type DirectoryImage = { url: string; width: number; height: number } | null;

export type FacilityCard = {
    uuid: string;
    facilitySlug: string;
    companySlug: string;
    displayName: string;
    facilityName: string | null;
    companyName: string | null;
    description: string | null;
    cityName: string | null;
    stateName: string | null;
    countryName: string | null;
    logo: DirectoryImage;
    isPromoted: boolean;
    serviceNames: string[];
};

export type FacilityProfile = FacilityCard & {
    banner: DirectoryImage;
    latitude: number | null;
    longitude: number | null;
    companyDomain: string | null;
    numEditSuitesOnline: number | null;
    numEditSuitesOffline: number | null;
    services: { uuid: string; name: string }[];
    productionTypes: string[];
    addresses: {
        uuid: string;
        name: string | null;
        address: string;
        cityName: string;
        state: string;
        postalCode: string;
        countryName: string;
    }[];
    spaces: { uuid: string; name: string; description: string; seatingCapacity: number; image: DirectoryImage }[];
    people: {
        uuid: string;
        name: string;
        title: string;
        imdbId: string | null;
        avatar: DirectoryImage;
        services: string[];
    }[];
};

export type Place = {
    kind: PlaceKind;
    slug: string;
    name: string;
    numFacilities: number;
    parentKind: PlaceKind | null;
    parentSlug: string | null;
};

export type Service = { uuid: string; name: string };

export type DirectoryList = { facilities: FacilityCard[]; hasMore: boolean };

/** The app fixes the directory page size; mirrored here so tools can report the next offset. */
export const DIRECTORY_PAGE_SIZE = 24;

export async function searchFacilities(options: {
    query?: string;
    placeSlug?: string;
    serviceUuid?: string;
    offset?: number;
}): Promise<DirectoryList> {
    "use cache";
    cacheLife("hours");
    cacheTag(DIRECTORY_CACHE_TAG);

    const params = new URLSearchParams();

    if (options.query) params.set("q", options.query);
    if (options.placeSlug) params.set("place", options.placeSlug);
    if (options.serviceUuid) params.set("service", options.serviceUuid);
    if (options.offset) params.set("offset", String(options.offset));

    return getJson<DirectoryList>(`${APP_API_URL}/api/www/directory/facilities?${params}&${bust()}`);
}

export async function getFacility(companySlug: string, facilitySlug: string): Promise<FacilityProfile | null> {
    "use cache";
    cacheLife("hours");
    cacheTag(DIRECTORY_CACHE_TAG);

    const body = await getJson<{ profile: FacilityProfile }>(
        `${APP_API_URL}/api/www/directory/facility/${encodeURIComponent(companySlug)}/${encodeURIComponent(facilitySlug)}?${bust()}`,
        { allowNotFound: true },
    );

    return body?.profile ?? null;
}

export async function getPlaces(): Promise<Place[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(DIRECTORY_CACHE_TAG);

    return (await getJson<{ places: Place[] }>(`${APP_API_URL}/api/www/directory/places?${bust()}`)).places;
}

/**
 * The service taxonomy that `searchFacilities`'s `serviceUuid` filters on.
 *
 * Tolerates a 404: this endpoint ships with a later app release than the one currently deployed, and
 * an empty list degrades the service filter rather than taking every directory tool down with it.
 */
export async function getServices(locale?: string): Promise<Service[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(DIRECTORY_CACHE_TAG);

    const localeParam = locale ? `locale=${encodeURIComponent(locale)}&` : "";

    const body = await getJson<{ services: Service[] }>(
        `${APP_API_URL}/api/www/directory/services?${localeParam}${bust()}`,
        { allowNotFound: true },
    );

    return body?.services ?? [];
}
