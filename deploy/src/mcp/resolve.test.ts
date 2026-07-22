import { describe, expect, it } from "vitest";
import { blogId, facilityId, faqId, parseResourceId, placeId, planId } from "@/mcp/resolve";

describe("resource ids", () => {
    it("round-trips every kind", () => {
        expect(parseResourceId(facilityId("awesome-post", "bangkok"))).toEqual({
            kind: "facility",
            companySlug: "awesome-post",
            facilitySlug: "bangkok",
        });
        expect(parseResourceId(placeId("CITY", "bangkok"))).toEqual({
            kind: "place",
            placeKind: "CITY",
            slug: "bangkok",
        });
        expect(parseResourceId(faqId("58ec6634-0796-4f76-b215-19f3a19c7730"))).toEqual({
            kind: "faq",
            uuid: "58ec6634-0796-4f76-b215-19f3a19c7730",
        });
        expect(parseResourceId(blogId("introducing-mediawork"))).toEqual({
            kind: "blog",
            slug: "introducing-mediawork",
        });
        expect(parseResourceId(planId("abc-123"))).toEqual({ kind: "plan", uuid: "abc-123" });
    });

    // Only the first colon separates kind from key, so a key may contain one without escaping.
    it("splits on the first colon only", () => {
        expect(parseResourceId("blog:a:b:c")).toEqual({ kind: "blog", slug: "a:b:c" });
    });

    it("rejects malformed ids rather than throwing", () => {
        for (const id of [
            "",
            "blog",
            "blog:",
            ":bangkok",
            "unknown:thing",
            "facility:awesome-post",
            "facility:/bangkok",
            "facility:awesome-post/",
            "place:REGION/bangkok",
            "place:bangkok",
        ]) {
            expect(parseResourceId(id), id).toBeNull();
        }
    });

    it("accepts a lowercase place kind", () => {
        expect(parseResourceId("place:city/bangkok")).toEqual({ kind: "place", placeKind: "CITY", slug: "bangkok" });
    });
});
