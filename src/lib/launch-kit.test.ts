import { describe, expect, it } from "vitest";
import { buildLaunchKit } from "@/lib/launch-kit";
import type { AuditResponse } from "@/lib/types";

const report: AuditResponse = {
  objective: "Conseguir 100 stars en 30 dias",
  repoUrl: "https://github.com/acme/launchpad",
  score: 54,
  maxScore: 100,
  summary: "Necesita mejorar onboarding.",
  metrics: {
    fullName: "acme/launchpad",
    description: "Audita repositorios de GitHub.",
    stars: 12,
    forks: 2,
    watchers: 1,
    openIssues: 3,
    topics: ["github", "growth", "opensource"],
    primaryLanguage: "TypeScript",
    license: "MIT",
    homepage: "https://launchpad.example.com",
    hasRelease: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    pushedAt: "2026-04-20T00:00:00.000Z",
  },
  checks: [],
  actions: [],
  distributionPlan: [],
};

describe("buildLaunchKit", () => {
  it("genera los archivos base esperados", () => {
    const files = buildLaunchKit(report);

    expect(files.map((file) => file.path)).toEqual([
      "README.md",
      "CONTRIBUTING.md",
      ".github/ISSUE_TEMPLATE/bug_report.md",
      ".github/ISSUE_TEMPLATE/feature_request.md",
      ".github/pull_request_template.md",
      "CHANGELOG.md",
    ]);
  });

  it("personaliza README y contributing con datos del informe", () => {
    const files = buildLaunchKit(report);
    const readme = files.find((file) => file.path === "README.md")?.content ?? "";
    const contributing = files.find((file) => file.path === "CONTRIBUTING.md")?.content ?? "";

    expect(readme).toContain("# launchpad");
    expect(readme).toContain("Conseguir 100 stars");
    expect(readme).toContain("https://launchpad.example.com");
    expect(contributing).toContain("https://github.com/acme/launchpad");
  });

  it("evita contenido vacio", () => {
    const files = buildLaunchKit(report);

    expect(files.every((file) => file.content.trim().length > 40)).toBe(true);
  });
});
