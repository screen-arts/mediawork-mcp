import "server-only";

/**
 * The one place this project talks to anything. It holds a base URL and nothing else — no database
 * credentials, no secrets — which is what makes "read-only" a property of the deployment rather
 * than a promise about the code.
 */
export const APP_API_URL = process.env.APP_API_URL ?? "https://app.mediawork.io";

export const DIRECTORY_CACHE_TAG = "directory";
export const PLANS_CACHE_TAG = "plans";
export const FAQ_CACHE_TAG = "faq";
export const BLOG_CACHE_TAG = "blog";

/**
 * The app's CDN caches these responses, so a cache fill that went through it could re-cache stale
 * data here for hours. Runs only on a miss, so the app sees roughly one request per tool per hour.
 */
export function bust(): string {
    return `t=${Date.now()}`;
}

export async function getJson<T>(url: string): Promise<T>;
export async function getJson<T>(url: string, options: { allowNotFound: true }): Promise<T | null>;
export async function getJson<T>(url: string, options?: { allowNotFound?: boolean }): Promise<T | null> {
    const response = await fetch(url, { headers: { Accept: "application/json" } });

    if (options?.allowNotFound && response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Mediawork API responded ${response.status} for ${new URL(url).pathname}`);
    }

    return (await response.json()) as T;
}
