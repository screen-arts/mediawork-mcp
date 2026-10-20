import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { APP_API_URL, BLOG_CACHE_TAG, bust, FAQ_CACHE_TAG, getJson, PLANS_CACHE_TAG } from "@/lib/fetch";

/**
 * FAQs, blog posts and subscription plans from the product app's public API. Same mirrored-types,
 * cached-for-hours arrangement as directory-api.ts.
 */

export type FaqItem = { uuid: string; q: string; a: string };

export type FaqCategory = { slug: string; title: string; items: FaqItem[] };

export type BlogPostCard = {
    slug: string;
    title: string;
    excerpt: string;
    authorName: string | null;
    publishedDate: string;
    modifiedDate: string | null;
};

export type BlogPost = BlogPostCard & {
    bodyHtml: string;
    // Absent until the app release that added it is live; the shaper falls back to bodyHtml.
    bodyMarkdown?: string;
    seoTitle: string | null;
    seoDescription: string | null;
};

export type ProductPrice = {
    uuid: string;
    price: number | string;
    currencyCode: string;
    currencySymbol: string;
    interval: "DAY" | "WEEK" | "MONTH" | "YEAR";
    intervalCount: number;
    trialPeriodDays: number | null;
};

export type ProductDisplayFeature = {
    symbol: "CHECK" | "X" | "INFINITY" | "DASH" | "NUMBER";
    number?: number;
    text: string;
};

export type ProductDisplaySection = { title: string; features: ProductDisplayFeature[] };

export type Product = {
    uuid: string;
    name: string | null;
    tagline: string | null;
    description: string | null;
    displaySections: ProductDisplaySection[] | null;
    isFree: 0 | 1;
    billingModel: "FLAT_RATE" | "PER_SEAT" | null;
    prices: ProductPrice[] | null;
};

export type PlanComparisonValue = { symbol: ProductDisplayFeature["symbol"]; number: number | null };

// One row per display feature at least one plan has a value for; `values` is keyed by product uuid and a plan absent from it
// does not include the feature.
export type PlanComparisonSection = {
    title: string;
    features: { label: string; tooltip: string | null; values: Record<string, PlanComparisonValue> }[];
};

export type Plans = { products: Product[]; comparison: PlanComparisonSection[] };

// `locale` is a cache-key argument: each locale gets its own cached response, all under one tag. `surface=mcp` asks
// for the questions an admin has switched on for the MCP server; an app that predates surfaces ignores it.
export async function getFaq(locale?: string): Promise<FaqCategory[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(FAQ_CACHE_TAG);

    const localeParam = locale ? `locale=${encodeURIComponent(locale)}&` : "";

    return (
        await getJson<{ categories: FaqCategory[] }>(`${APP_API_URL}/api/www/faq?${localeParam}surface=mcp&${bust()}`)
    ).categories;
}

export async function getBlogPosts(): Promise<BlogPostCard[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(BLOG_CACHE_TAG);

    return (await getJson<{ posts: BlogPostCard[] }>(`${APP_API_URL}/api/www/blog?${bust()}`)).posts;
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
    "use cache";
    cacheLife("hours");
    cacheTag(BLOG_CACHE_TAG);

    const body = await getJson<{ post: BlogPost }>(
        `${APP_API_URL}/api/www/blog/${encodeURIComponent(slug)}?${bust()}`,
        { allowNotFound: true },
    );

    return body?.post ?? null;
}

// `comparison` arrived after `products`; an older app release omits it.
export async function getPlans(locale?: string): Promise<Plans> {
    "use cache";
    cacheLife("hours");
    cacheTag(PLANS_CACHE_TAG);

    const localeParam = locale ? `locale=${encodeURIComponent(locale)}&` : "";
    const body = await getJson<Partial<Plans>>(`${APP_API_URL}/api/www/products?${localeParam}${bust()}`);

    return { products: body.products ?? [], comparison: body.comparison ?? [] };
}

export async function getProducts(locale?: string): Promise<Product[]> {
    return (await getPlans(locale)).products;
}
