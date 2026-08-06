import { describe, expect, it } from "vitest";
import type { BlogPost, FaqCategory, Product } from "@/lib/content-api";
import type { FacilityCard, FacilityProfile } from "@/lib/directory-api";
import { shapeBlogPost, shapeFacilityCard, shapeFacilityProfile, shapeFaq, shapeProducts } from "@/mcp/shape";

const card: FacilityCard = {
    uuid: "facility-uuid",
    facilitySlug: "bangkok",
    companySlug: "awesome-post",
    displayName: "Awesome Post — Bangkok",
    facilityName: "Bangkok",
    companyName: "Awesome Post",
    description: "Picture and sound finishing.",
    cityName: "Bangkok",
    stateName: null,
    countryName: "Thailand",
    logo: { url: "https://uploads.mediawork.io/logo.webp", width: 512, height: 512 },
    isPromoted: true,
    serviceNames: ["Editorial", "Sound Post"],
};

const profile: FacilityProfile = {
    ...card,
    banner: null,
    latitude: 13.7,
    longitude: 100.5,
    companyDomain: "awesomepost.example",
    numEditSuitesOnline: 4,
    numEditSuitesOffline: null,
    services: [{ uuid: "service-uuid", name: "Editorial" }],
    productionTypes: ["Feature", "Series"],
    addresses: [],
    spaces: [
        {
            uuid: "space-uuid",
            name: "Suite 1",
            description: "Grading theatre",
            seatingCapacity: 6,
            image: { url: "https://uploads.mediawork.io/suite.webp", width: 1200, height: 800 },
        },
    ],
    people: [
        {
            uuid: "person-uuid",
            name: "Alex Rivera",
            title: "Colourist",
            imdbId: "nm1234567",
            avatar: { url: "https://uploads.mediawork.io/alex.webp", width: 256, height: 256 },
            services: ["Picture Post"],
        },
    ],
};

describe("shapeFacilityCard", () => {
    it("carries a canonical url and flattens the logo to a single string", () => {
        const shaped = shapeFacilityCard(card);

        expect(shaped.url).toBe("https://www.mediawork.io/directory/awesome-post/bangkok");
        expect(shaped.logo).toBe("https://uploads.mediawork.io/logo.webp");
        expect(shaped.name).toBe("Awesome Post — Bangkok");
    });

    // Null and empty values are dropped rather than serialised, so trimmed fields cost no tokens.
    it("drops empty fields", () => {
        const shaped = shapeFacilityCard({ ...card, stateName: null, serviceNames: [], description: null });

        expect(shaped).not.toHaveProperty("state");
        expect(shaped).not.toHaveProperty("services");
        expect(shaped).not.toHaveProperty("description");
        expect(shaped).toHaveProperty("country", "Thailand");
    });

    it("localises the url", () => {
        expect(shapeFacilityCard(card, "fr").url).toBe("https://www.mediawork.io/fr/directory/awesome-post/bangkok");
    });
});

describe("shapeFacilityProfile", () => {
    it("exposes the creatives with what each of them does", () => {
        const shaped = shapeFacilityProfile(profile);

        expect(shaped.creatives).toEqual([
            { name: "Alex Rivera", title: "Colourist", services: ["Picture Post"], imdbId: "nm1234567" },
        ]);
    });

    it("keeps the card fields and adds the profile-only ones", () => {
        const shaped = shapeFacilityProfile(profile);

        expect(shaped.url).toBe("https://www.mediawork.io/directory/awesome-post/bangkok");
        expect(shaped.website).toBe("awesomepost.example");
        expect(shaped.productionTypes).toEqual(["Feature", "Series"]);
        expect(shaped.editSuites).toEqual({ online: 4 });
        expect(shaped.spaces).toEqual([{ name: "Suite 1", description: "Grading theatre", seatingCapacity: 6 }]);
        // An empty collection is dropped entirely rather than shipped as [].
        expect(shaped).not.toHaveProperty("addresses");
    });

    it("drops the edit suite counts when neither is known", () => {
        const shaped = shapeFacilityProfile({ ...profile, numEditSuitesOnline: null, numEditSuitesOffline: null });

        expect(shaped).not.toHaveProperty("editSuites");
    });
});

const faq: FaqCategory[] = [
    {
        slug: "getting-started",
        title: "Getting started",
        items: [
            { uuid: "a", q: "How do I invite a vendor?", a: "Open the tender and choose facilities." },
            { uuid: "b", q: "What is a tender?", a: "A request for quotes sent to vendors." },
        ],
    },
    {
        slug: "billing",
        title: "Billing",
        items: [{ uuid: "c", q: "Can I change plan?", a: "Yes, at any time from the billing page." }],
    },
];

describe("shapeFaq", () => {
    // The whole FAQ body would crowd out everything else in a context window, so an unqualified
    // call returns the questions and lets the model choose what to search for.
    it("returns questions only when there is no query", () => {
        const shaped = shapeFaq(faq, undefined);

        expect(shaped).toHaveLength(2);
        expect(shaped[0].items).toEqual([{ q: "How do I invite a vendor?" }, { q: "What is a tender?" }]);
    });

    it("returns answers for matching questions", () => {
        const shaped = shapeFaq(faq, "tender");

        expect(shaped).toHaveLength(1);
        expect(shaped[0].category).toBe("Getting started");
        expect(shaped[0].items).toEqual([
            { q: "How do I invite a vendor?", a: "Open the tender and choose facilities." },
            { q: "What is a tender?", a: "A request for quotes sent to vendors." },
        ]);
    });

    it("matches on the answer as well as the question", () => {
        const shaped = shapeFaq(faq, "billing page");

        expect(shaped).toHaveLength(1);
        expect(shaped[0].items).toEqual([{ q: "Can I change plan?", a: "Yes, at any time from the billing page." }]);
    });

    it("drops categories with no match", () => {
        expect(shapeFaq(faq, "nothing matches this")).toEqual([]);
    });
});

const products: Product[] = [
    {
        uuid: "product-uuid",
        name: "Pro",
        tagline: "For busy facilities",
        description: null,
        displaySections: [
            {
                title: "Quoting",
                features: [
                    { symbol: "CHECK", text: "Bid templates" },
                    { symbol: "X", text: "Custom branding" },
                    { symbol: "INFINITY", text: "quote requests" },
                    { symbol: "NUMBER", number: 5, text: "seats" },
                ],
            },
        ],
        isFree: 0,
        billingModel: "FLAT_RATE",
        prices: [
            {
                uuid: "p1",
                price: 99,
                currencyCode: "USD",
                currencySymbol: "$",
                interval: "MONTH",
                intervalCount: 1,
                trialPeriodDays: 14,
            },
            {
                uuid: "p2",
                price: 79,
                currencyCode: "GBP",
                currencySymbol: "£",
                interval: "MONTH",
                intervalCount: 1,
                trialPeriodDays: null,
            },
        ],
    },
];

describe("shapeProducts", () => {
    it("returns every currency when none is asked for", () => {
        expect(shapeProducts(products, undefined)[0].prices).toHaveLength(2);
    });

    it("filters to one currency, case-insensitively", () => {
        expect(shapeProducts(products, "gbp")[0].prices).toEqual([{ price: 79, currency: "GBP", interval: "MONTH" }]);
    });

    it("returns no prices for a currency that is not published", () => {
        expect(shapeProducts(products, "JPY")[0]).not.toHaveProperty("prices");
    });

    // The display symbol carries the meaning; rendering it into the text is what lets a model
    // answer "is X included in this plan".
    it("renders feature symbols into readable text", () => {
        expect(shapeProducts(products, "USD")[0].features).toEqual([
            {
                title: "Quoting",
                features: ["✓ Bid templates", "✗ Custom branding", "Unlimited quote requests", "5 seats"],
            },
        ]);
    });
});

const post: BlogPost = {
    slug: "introducing-mediawork",
    title: "Introducing Mediawork",
    excerpt: "Why we built it.",
    authorName: "Graham",
    publishedDate: "2026-01-01T00:00:00.000Z",
    modifiedDate: null,
    bodyHtml: "<p>Hello</p>",
    bodyMarkdown: "Hello",
    seoTitle: null,
    seoDescription: null,
};

describe("shapeBlogPost", () => {
    it("prefers the markdown body", () => {
        expect(shapeBlogPost(post).body).toBe("Hello");
    });

    // bodyMarkdown only exists from the app release that added it; an older deployment should still
    // yield a readable post rather than an empty one.
    it("falls back to the rendered html when markdown is absent", () => {
        expect(shapeBlogPost({ ...post, bodyMarkdown: undefined }).body).toBe("<p>Hello</p>");
    });

    it("carries the canonical post url", () => {
        expect(shapeBlogPost(post).url).toBe("https://www.mediawork.io/blog/introducing-mediawork");
    });
});
