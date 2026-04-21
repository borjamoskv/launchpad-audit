import { describe, expect, it } from "vitest";
import { buildAuditReport, evaluateReadme } from "@/lib/audit";
import type { RepoSnapshot } from "@/lib/github";

const richReadme = [
  "# Proyecto",
  "## Instalación",
  "## Usage",
  "## Demo",
  "## Contributing",
  "## Roadmap",
  "## License",
  "```bash\nnpm install\n```",
  ...Array.from({ length: 280 }, (_, index) => `palabra-${index}`),
].join("\n");

const buildSnapshot = (overrides: Partial<RepoSnapshot> = {}): RepoSnapshot => ({
  fullName: "owner/repo",
  description: "Repo de prueba",
  stars: 120,
  forks: 20,
  watchers: 10,
  openIssues: 4,
  topics: ["nextjs", "growth", "opensource", "analytics", "github"],
  primaryLanguage: "TypeScript",
  license: "MIT",
  homepage: "https://example.com",
  hasRelease: true,
  readmeContent: richReadme,
  hasContributing: true,
  hasIssueTemplates: true,
  hasPullRequestTemplate: true,
  hasCodeOfConduct: true,
  hasChangelog: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  pushedAt: new Date().toISOString(),
  ...overrides,
});

describe("evaluateReadme", () => {
  it("devuelve 0 puntos cuando no hay README", () => {
    const result = evaluateReadme(null);

    expect(result.points).toBe(0);
    expect(result.detail.toLowerCase()).toContain("readme");
  });

  it("otorga puntuación alta para README completo", () => {
    const result = evaluateReadme(richReadme);

    expect(result.points).toBeGreaterThanOrEqual(18);
  });
});

describe("buildAuditReport", () => {
  it("alcanza score máximo con señales de repositorio sólido", () => {
    const report = buildAuditReport(
      buildSnapshot(),
      "Conseguir más stars",
      "https://github.com/owner/repo",
    );

    expect(report.score).toBe(report.maxScore);
    expect(report.actions).toHaveLength(0);
  });

  it("prioriza acciones de alto impacto cuando faltan fundamentos", () => {
    const report = buildAuditReport(
      buildSnapshot({
        readmeContent: "README corto",
        license: null,
        topics: [],
        homepage: null,
        hasContributing: false,
        hasIssueTemplates: false,
        hasRelease: false,
        pushedAt: "2024-01-01T00:00:00.000Z",
      }),
      "Lanzar el proyecto",
      "https://github.com/owner/repo",
    );

    expect(report.score).toBeLessThan(60);
    expect(report.actions[0]?.priority).toBe("high");
    expect(report.actions.some((action) => action.title.includes("README"))).toBe(true);
  });
});
