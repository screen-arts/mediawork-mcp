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

// `locale` is a cache-key argument: each locale gets its own cached response, all under one tag.
export async function getFaq(locale?: string): Promise<FaqCategory[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(FAQ_CACHE_TAG);

    const localeParam = locale ? `locale=${encodeURIComponent(locale)}&` : "";

    return (await getJson<{ categories: FaqCategory[] }>(`${APP_API_URL}/api/www/faq?${localeParam}${bust()}`))
        .categories;
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

export async function getProducts(locale?: string): Promise<Product[]> {
    "use cache";
    cacheLife("hours");
    cacheTag(PLANS_CACHE_TAG);

    const localeParam = locale ? `locale=${encodeURIComponent(locale)}&` : "";

    return (await getJson<{ products: Product[] }>(`${APP_API_URL}/api/www/products?${localeParam}${bust()}`)).products;
}
