import { z } from "zod";

// Every shaped object drops empty fields (`compact` in shape.ts), so all but its url may be absent.

const facilityCard = {
    name: z.string().optional(),
    companySlug: z.string().optional(),
    facilitySlug: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    description: z.string().optional(),
    services: z.array(z.string()).optional(),
    logo: z.string().optional(),
    url: z.string(),
};

export const FACILITY_CARD = z.object(facilityCard);

export const FACILITY_PROFILE = z.object({
    ...facilityCard,
    website: z.string().optional(),
    productionTypes: z.array(z.string()).optional(),
    accreditations: z.array(z.string()).optional(),
    editSuites: z.object({ online: z.number().optional(), offline: z.number().optional() }).optional(),
    addresses: z
        .array(
            z.object({
                name: z.string().optional(),
                address: z.string().optional(),
                city: z.string().optional(),
                state: z.string().optional(),
                postalCode: z.string().optional(),
                country: z.string().optional(),
            }),
        )
        .optional(),
    spaces: z
        .array(
            z.object({
                name: z.string().optional(),
                description: z.string().optional(),
                seatingCapacity: z.number().optional(),
            }),
        )
        .optional(),
    equipment: z
        .array(
            z.object({
                name: z.string().optional(),
                make: z.string().optional(),
                model: z.string().optional(),
                type: z.string().optional(),
                quantity: z.number().optional(),
            }),
        )
        .optional(),
    creatives: z
        .array(
            z.object({
                name: z.string().optional(),
                title: z.string().optional(),
                services: z.array(z.string()).optional(),
                imdbId: z.string().optional(),
            }),
        )
        .optional(),
});

export const PLACE = z.object({
    name: z.string().optional(),
    type: z.string().optional(),
    slug: z.string().optional(),
    numFacilities: z.number().optional(),
    parent: z.string().optional(),
    url: z.string(),
});

export const SERVICE = z.object({ uuid: z.string(), name: z.string() });

export const FAQ = z.object({
    faq: z.array(
        z.object({
            category: z.string(),
            url: z.string(),
            items: z.array(z.object({ q: z.string(), a: z.string().optional() })),
        }),
    ),
});

const blogCard = {
    slug: z.string().optional(),
    title: z.string().optional(),
    excerpt: z.string().optional(),
    author: z.string().optional(),
    publishedDate: z.string().optional(),
    url: z.string(),
};

export const BLOG_CARD = z.object(blogCard);

export const BLOG_POST = z.object({ ...blogCard, body: z.string().optional() });

export const PLAN = z.object({
    name: z.string().optional(),
    tagline: z.string().optional(),
    description: z.string().optional(),
    isFree: z.boolean(),
    billingModel: z.string().optional(),
    prices: z
        .array(
            z.object({
                price: z.union([z.number(), z.string()]),
                currency: z.string(),
                interval: z.string(),
                intervalCount: z.number().optional(),
                trialPeriodDays: z.number().optional(),
            }),
        )
        .optional(),
    features: z.array(z.object({ title: z.string(), features: z.array(z.string()) })).optional(),
    url: z.string(),
});

export const PLAN_COMPARISON = z.array(
    z.object({
        title: z.string(),
        features: z.array(
            z.object({
                feature: z.string().optional(),
                note: z.string().optional(),
                plans: z.record(z.string(), z.string()),
            }),
        ),
    }),
);

export const SEARCH_RESULTS = z.object({
    results: z.array(z.object({ id: z.string(), title: z.string(), url: z.string() })),
});

export const FETCHED_RECORD = z.object({ id: z.string(), title: z.string(), url: z.string(), text: z.string() });
