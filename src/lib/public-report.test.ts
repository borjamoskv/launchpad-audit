import { describe, expect, it, vi } from "vitest";
import { buildPublicReportImageUrl, getAppOrigin } from "@/lib/public-report";

describe("getAppOrigin", () => {
  it("uses the configured public app URL when present", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");

    expect(getAppOrigin()).toBe("https://example.com");

    vi.unstubAllEnvs();
  });

  it("falls back to production URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    expect(getAppOrigin()).toBe("https://launchpad-audit.vercel.app");

    vi.unstubAllEnvs();
  });
});

describe("buildPublicReportImageUrl", () => {
  it("builds the colocated Open Graph image URL", () => {
    expect(buildPublicReportImageUrl("https://launchpad-audit.vercel.app/r/vercel/next.js")).toBe(
      "https://launchpad-audit.vercel.app/r/vercel/next.js/opengraph-image",
    );
  });
});
