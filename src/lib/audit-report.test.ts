import { describe, expect, it } from "vitest";
import { buildAuditMarkdownReport } from "@/lib/audit-report";
import type { AuditResponse } from "@/lib/types";

const report: AuditResponse = {
  objective: "Conseguir 100 stars en 30 dias",
  repoUrl: "https://github.com/acme/launchpad",
  score: 62,
  maxScore: 100,
  summary: "Buen punto de partida.",
  metrics: {
    fullName: "acme/launchpad",
    description: "Audita repositorios.",
    stars: 24,
    forks: 4,
    watchers: 2,
    openIssues: 6,
    topics: ["github", "growth"],
    primaryLanguage: "TypeScript",
    license: "MIT",
    homepage: "https://launchpad.example.com",
    hasRelease: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    pushedAt: "2026-04-21T00:00:00.000Z",
  },
  checks: [
    {
      id: "readme-quality",
      label: "README orientado a conversion",
      weight: 20,
      passed: false,
      points: 12,
      detail: "Falta demo visual.",
      suggestedAction: "Anade demo.",
      priority: "high",
    },
  ],
  actions: [
    {
      title: "README orientado a conversion",
      description: "Anade demo, quickstart y roadmap.",
      impact: "+8 puntos potenciales de score",
      priority: "high",
    },
  ],
  distributionPlan: [
    {
      channel: "X",
      hook: "Lanzamiento acme/launchpad",
      copy: "He publicado acme/launchpad.",
      cta: "Pide feedback.",
      recommendedWhen: "Martes por la manana.",
    },
  ],
};

describe("buildAuditMarkdownReport", () => {
  it("incluye resumen, score y metricas principales", () => {
    const markdown = buildAuditMarkdownReport(report);

    expect(markdown).toContain("# Launchpad Audit: acme/launchpad");
    expect(markdown).toContain("**Score:** 62/100");
    expect(markdown).toContain("- Stars: 24");
    expect(markdown).toContain("`github`, `growth`");
  });

  it("incluye acciones, checklist y distribucion", () => {
    const markdown = buildAuditMarkdownReport(report);

    expect(markdown).toContain("## Acciones Prioritarias");
    expect(markdown).toContain("README orientado a conversion");
    expect(markdown).toContain("| Check | Estado | Puntos | Prioridad | Detalle |");
    expect(markdown).toContain("### X");
  });
});
