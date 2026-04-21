import { afterEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { EXPLORE_PATH, getFeaturedPublicRepoPaths } from "@/lib/public-index";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sitemap", () => {
  it("includes home, explore and every featured public report", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");

    const urls = sitemap().map((entry) => entry.url);
    const expectedFeaturedUrls = getFeaturedPublicRepoPaths().map((path) => `https://example.com${path}`);

    expect(urls).toContain("https://example.com");
    expect(urls).toContain(`https://example.com${EXPLORE_PATH}`);
    expect(urls).toEqual(expect.arrayContaining(expectedFeaturedUrls));
    expect(new Set(urls).size).toBe(urls.length);
  });
});
