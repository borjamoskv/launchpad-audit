import { describe, expect, it, vi } from "vitest";
import {
  buildPublicReportFreshness,
  buildPublicReportImageUrl,
  formatRevalidateWindow,
  getAppOrigin,
  PUBLIC_REPORT_REVALIDATE_SECONDS,
} from "@/lib/public-report";

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

describe("public report freshness", () => {
  it("formats revalidation windows for user-facing copy", () => {
    expect(formatRevalidateWindow(1800)).toBe("30 min");
    expect(formatRevalidateWindow(3600)).toBe("1 hora");
    expect(formatRevalidateWindow(7200)).toBe("2 horas");
  });

  it("describes public cache without private token usage", () => {
    const freshness = buildPublicReportFreshness();

    expect(freshness.revalidateSeconds).toBe(PUBLIC_REPORT_REVALIDATE_SECONDS);
    expect(freshness.label).toContain("GitHub público");
    expect(freshness.label).toContain("No usa tokens privados");
  });
});
