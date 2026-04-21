import { describe, expect, it } from "vitest";
import { buildLaunchSprint } from "@/lib/launch-sprint";
import type { AuditResponse } from "@/lib/types";

const report: AuditResponse = {
  objective: "Ganar traccion",
  repoUrl: "https://github.com/acme/rocket",
  score: 70,
  maxScore: 100,
  summary: "Buen punto de partida.",
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
  actions: [
    {
      title: "README orientado a conversión",
      description: "Añade demo y quickstart.",
      impact: "+10 puntos potenciales de score",
      priority: "high",
    },
  ],
  distributionPlan: [
    {
      channel: "X",
      hook: "Lanzamiento acme/rocket",
      copy: "Busco feedback técnico.",
      cta: "Pide una estrella y un comentario.",
      recommendedWhen: "Martes.",
    },
  ],
};

describe("buildLaunchSprint", () => {
  it("builds a deterministic seven-day execution plan", () => {
    const sprint = buildLaunchSprint(report);

    expect(sprint).toHaveLength(7);
    expect(sprint.map((step) => step.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(sprint[0].title).toContain("README orientado a conversión");
    expect(sprint[2].description).toContain("acme/rocket");
    expect(sprint[6].title).toBe("Medir y relanzar");
  });

  it("uses safe fallbacks when actions and distribution are empty", () => {
    const sprint = buildLaunchSprint({
      ...report,
      actions: [],
      distributionPlan: [],
    });

    expect(sprint[0].title).toContain("Refinar narrativa");
    expect(sprint[3].title).toBe("Publicar primer anuncio");
    expect(sprint[4].title).toBe("Recoger objeciones");
  });
});
