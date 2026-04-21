import { describe, expect, it } from "vitest";
import {
  buildReadmeBadgeMarkdown,
  buildScoreBadgeSvg,
  escapeSvgText,
  getScoreBadgeColor,
} from "@/lib/badge";
import type { AuditResponse } from "@/lib/types";

const report: AuditResponse = {
  objective: "Ganar traccion",
  repoUrl: "https://github.com/acme/rocket",
  score: 82,
  maxScore: 100,
  summary: "Listo para crecer.",
  metrics: {
    fullName: "acme/rocket",
    description: "Repo de prueba",
    stars: 100,
    forks: 10,
    watchers: 5,
    openIssues: 2,
    topics: [],
    primaryLanguage: "TypeScript",
    license: "MIT",
    homepage: "https://example.com",
    hasRelease: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    pushedAt: "2026-04-01T00:00:00.000Z",
  },
  checks: [],
  actions: [],
  distributionPlan: [],
};

describe("escapeSvgText", () => {
  it("escapes markup-sensitive characters", () => {
    expect(escapeSvgText("<script>alert('x')</script>")).toBe(
      "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
    );
  });
});

describe("getScoreBadgeColor", () => {
  it("selects stable colors by score ratio", () => {
    expect(getScoreBadgeColor(90, 100)).toBe("#047857");
    expect(getScoreBadgeColor(70, 100)).toBe("#0284c7");
    expect(getScoreBadgeColor(50, 100)).toBe("#d97706");
    expect(getScoreBadgeColor(20, 100)).toBe("#be123c");
  });
});

describe("buildScoreBadgeSvg", () => {
  it("renders a safe svg badge without raw user markup", () => {
    const svg = buildScoreBadgeSvg({
      score: 82,
      maxScore: 100,
      repoFullName: "acme/<script>",
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("82/100");
    expect(svg).toContain("Launchpad Audit score for acme/&lt;script&gt;: 82/100");
    expect(svg).not.toContain("acme/<script>");
  });

  it("clamps invalid scores before rendering", () => {
    const svg = buildScoreBadgeSvg({
      score: 999,
      maxScore: 100,
      repoFullName: "acme/rocket",
    });

    expect(svg).toContain("100/100");
  });
});

describe("buildReadmeBadgeMarkdown", () => {
  it("builds markdown that points to the public badge endpoint", () => {
    const markdown = buildReadmeBadgeMarkdown({
      appOrigin: "https://launchpad-audit.vercel.app",
      report,
    });

    expect(markdown).toBe(
      "[![Launchpad Score](https://launchpad-audit.vercel.app/api/badge?repoUrl=https%3A%2F%2Fgithub.com%2Facme%2Frocket)](https://launchpad-audit.vercel.app/r/acme/rocket)",
    );
  });
});
