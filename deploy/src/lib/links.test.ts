import { describe, expect, it } from "vitest";
import { blogPostUrl, facilityUrl, faqUrl, placeUrl, pricingUrl } from "@/lib/links";

// www runs next-intl with localePrefix "as-needed": English keeps the unprefixed URLs, every other
// language is prefixed. Both halves of that rule are asserted for each builder, because getting it
// wrong 404s exactly one language and nothing else.
describe("links", () => {
    it("leaves English unprefixed", () => {
        expect(facilityUrl("awesome-post", "bangkok")).toBe("https://www.mediawork.io/directory/awesome-post/bangkok");
        expect(facilityUrl("awesome-post", "bangkok", "en")).toBe(
            "https://www.mediawork.io/directory/awesome-post/bangkok",
        );
    });

    it("prefixes every other locale", () => {
        expect(facilityUrl("awesome-post", "bangkok", "fr")).toBe(
            "https://www.mediawork.io/fr/directory/awesome-post/bangkok",
        );
        expect(blogPostUrl("introducing-mediawork", "ja")).toBe(
            "https://www.mediawork.io/ja/blog/introducing-mediawork",
        );
        expect(faqUrl("es")).toBe("https://www.mediawork.io/es/faq");
    });

    it("lowercases the place kind into the path segment", () => {
        expect(placeUrl("CITY", "bangkok")).toBe("https://www.mediawork.io/directory/city/bangkok");
        expect(placeUrl("STATE", "california")).toBe("https://www.mediawork.io/directory/state/california");
        expect(placeUrl("COUNTRY", "thailand", "de")).toBe("https://www.mediawork.io/de/directory/country/thailand");
    });

    // Pricing lives on the www home page, so the English URL has no path at all beyond the slash.
    it("points pricing at the home page", () => {
        expect(pricingUrl()).toBe("https://www.mediawork.io/");
        expect(pricingUrl("pt")).toBe("https://www.mediawork.io/pt/");
    });
});
