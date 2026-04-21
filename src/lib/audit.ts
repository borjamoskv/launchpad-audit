import type {
  AuditCheck,
  AuditResponse,
  DistributionPost,
  PrioritizedAction,
  PriorityLevel,
  RepoMetrics,
} from "@/lib/types";
import type { RepoSnapshot } from "@/lib/github";

interface ReadmeInsights {
  points: number;
  detail: string;
}

interface CriterionResult {
  points: number;
  detail: string;
  suggestedAction: string;
  priority: PriorityLevel;
}

interface Criterion {
  id: string;
  label: string;
  weight: number;
  evaluate: (snapshot: RepoSnapshot, readme: ReadmeInsights) => CriterionResult;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const prioritize = (weight: number): PriorityLevel => {
  if (weight >= 10) return "high";
  if (weight >= 7) return "medium";
  return "low";
};

/**
 * Puntúa la calidad del README en base a cobertura, profundidad y ejemplos.
 */
export const evaluateReadme = (readmeContent: string | null): ReadmeInsights => {
  if (!readmeContent) {
    return {
      points: 0,
      detail: "No se ha detectado README público.",
    };
  }

  const clean = readmeContent.replace(/\r/g, "").trim();

  if (!clean) {
    return {
      points: 0,
      detail: "README vacío.",
    };
  }

  const wordCount = clean.split(/\s+/).filter(Boolean).length;

  const sectionPatterns = [
    /(^|\n)#+\s*(instalaci[oó]n|installation)/i,
    /(^|\n)#+\s*(uso|usage|getting started)/i,
    /(^|\n)#+\s*(demo|preview|capturas|screenshots)/i,
    /(^|\n)#+\s*(contributing|contribuir)/i,
    /(^|\n)#+\s*(roadmap|plan)/i,
    /(^|\n)#+\s*(licen[cs]e|licencia)/i,
  ];

  const sectionHits = sectionPatterns.filter((pattern) => pattern.test(clean)).length;
  const hasCodeBlock = /```[\s\S]+?```/.test(clean);

  const depthPoints = wordCount >= 250 ? 6 : wordCount >= 120 ? 3 : 1;
  const sectionPoints = Math.min(10, sectionHits * 2);
  const codePoints = hasCodeBlock ? 4 : 0;

  const points = Math.min(20, depthPoints + sectionPoints + codePoints);

  return {
    points,
    detail: `README con ${wordCount} palabras, ${sectionHits} secciones clave y ${hasCodeBlock ? "con" : "sin"} ejemplos de código.`,
  };
};

const daysSince = (isoDate: string): number => {
  const timestamp = new Date(isoDate).getTime();

  if (Number.isNaN(timestamp)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((Date.now() - timestamp) / MS_PER_DAY);
};

const buildCriteria = (): Criterion[] => [
  {
    id: "readme-quality",
    label: "README orientado a conversión",
    weight: 20,
    evaluate: (_, readme) => ({
      points: readme.points,
      detail: readme.detail,
      suggestedAction:
        "Amplía README con demo visual, quickstart en 3 pasos y roadmap público para mejorar conversión visita→star.",
      priority: "high",
    }),
  },
  {
    id: "license",
    label: "Licencia explícita",
    weight: 10,
    evaluate: (snapshot) => ({
      points: snapshot.license ? 10 : 0,
      detail: snapshot.license
        ? `Licencia detectada: ${snapshot.license}.`
        : "No hay licencia detectada.",
      suggestedAction: "Añade una licencia OSS estándar (MIT/Apache-2.0) para reducir fricción legal.",
      priority: "high",
    }),
  },
  {
    id: "topics",
    label: "Etiquetas de descubrimiento",
    weight: 8,
    evaluate: (snapshot) => {
      const topicCount = snapshot.topics.length;
      const points = topicCount >= 5 ? 8 : topicCount >= 3 ? 6 : topicCount >= 1 ? 3 : 0;

      return {
        points,
        detail: `${topicCount} topics configurados en GitHub.`,
        suggestedAction:
          "Define 5+ topics precisos (problema, stack y audiencia) para aparecer en más búsquedas.",
        priority: "medium",
      };
    },
  },
  {
    id: "homepage",
    label: "Demo o homepage",
    weight: 7,
    evaluate: (snapshot) => ({
      points: snapshot.homepage ? 7 : 0,
      detail: snapshot.homepage
        ? `Homepage configurada: ${snapshot.homepage}`
        : "No hay URL pública de demo/homepage.",
      suggestedAction:
        "Publica una demo (Vercel/Netlify) y enlázala como homepage para validar valor en 30 segundos.",
      priority: "medium",
    }),
  },
  {
    id: "contributing",
    label: "Guía de contribución",
    weight: 10,
    evaluate: (snapshot) => ({
      points: snapshot.hasContributing ? 10 : 0,
      detail: snapshot.hasContributing
        ? "Existe CONTRIBUTING.md."
        : "No se detecta CONTRIBUTING.md.",
      suggestedAction:
        "Añade CONTRIBUTING.md con setup local, convenciones y flujo de PR para acelerar contribuciones.",
      priority: "high",
    }),
  },
  {
    id: "issue-templates",
    label: "Plantillas de issues",
    weight: 8,
    evaluate: (snapshot) => ({
      points: snapshot.hasIssueTemplates ? 8 : 0,
      detail: snapshot.hasIssueTemplates
        ? "Issue templates detectadas."
        : "No se detectan issue templates.",
      suggestedAction:
        "Crea templates para bug/feature para recibir feedback más accionable y comparable.",
      priority: "medium",
    }),
  },
  {
    id: "pr-template",
    label: "Plantilla de Pull Request",
    weight: 5,
    evaluate: (snapshot) => ({
      points: snapshot.hasPullRequestTemplate ? 5 : 0,
      detail: snapshot.hasPullRequestTemplate
        ? "PR template detectada."
        : "No se detecta plantilla de PR.",
      suggestedAction:
        "Añade un PR template con checklist de pruebas y cambios para mejorar calidad de aportes.",
      priority: "low",
    }),
  },
  {
    id: "changelog",
    label: "Changelog mantenido",
    weight: 8,
    evaluate: (snapshot) => ({
      points: snapshot.hasChangelog ? 8 : 0,
      detail: snapshot.hasChangelog
        ? "Changelog detectado."
        : "No se detecta changelog.",
      suggestedAction:
        "Publica CHANGELOG.md con cambios visibles por versión para generar confianza y retención.",
      priority: "medium",
    }),
  },
  {
    id: "releases",
    label: "Ritmo de releases",
    weight: 8,
    evaluate: (snapshot) => ({
      points: snapshot.hasRelease ? 8 : 0,
      detail: snapshot.hasRelease ? "Se detectan releases." : "No hay releases públicas.",
      suggestedAction:
        "Empieza con releases semanales o quincenales y notas claras para reforzar percepción de progreso.",
      priority: "medium",
    }),
  },
  {
    id: "code-of-conduct",
    label: "Código de conducta",
    weight: 6,
    evaluate: (snapshot) => ({
      points: snapshot.hasCodeOfConduct ? 6 : 0,
      detail: snapshot.hasCodeOfConduct
        ? "Código de conducta detectado."
        : "No se detecta código de conducta.",
      suggestedAction:
        "Incluye CODE_OF_CONDUCT.md para facilitar colaboración segura en comunidad abierta.",
      priority: "low",
    }),
  },
  {
    id: "activity",
    label: "Actividad reciente",
    weight: 10,
    evaluate: (snapshot) => {
      const days = daysSince(snapshot.pushedAt);

      const points = days <= 14 ? 10 : days <= 45 ? 8 : days <= 90 ? 5 : days <= 180 ? 2 : 0;

      return {
        points,
        detail: Number.isFinite(days)
          ? `Último push hace ${days} días.`
          : "No se pudo determinar última actividad.",
        suggestedAction:
          "Mantén un ritmo mínimo semanal de commits públicos para mejorar señal de proyecto vivo.",
        priority: "high",
      };
    },
  },
];

const sortPriority = (priority: PriorityLevel): number => {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
};

const buildSummary = (score: number): string => {
  if (score >= 80) {
    return "Base sólida. El repo ya está listo para escalar distribución y convertir interés en contributors.";
  }

  if (score >= 60) {
    return "Buen punto de partida. Corrigiendo los gaps de onboarding puedes acelerar el crecimiento de stars.";
  }

  if (score >= 40) {
    return "Hay señales positivas, pero faltan activos clave para transformar visitas en tracción sostenida.";
  }

  return "La visibilidad actual es baja. Conviene reforzar fundamentos de discoverability antes de campañas de difusión.";
};

const compact = (value: string | null | undefined): string => value?.trim() ?? "";

const buildDistributionPlan = (snapshot: RepoSnapshot, objective: string): DistributionPost[] => {
  const language = snapshot.primaryLanguage ?? "TypeScript";
  const goal = compact(objective) || "ganar tracción temprana";
  const topicTail = snapshot.topics.slice(0, 3).join(", ");
  const context = topicTail ? `(${topicTail})` : "";

  return [
    {
      channel: "X",
      hook: `Lanzamiento ${snapshot.fullName}: ${goal}`,
      copy: `He publicado ${snapshot.fullName} ${context}. Construido con ${language}. Busco feedback en onboarding y casos reales de uso.`,
      cta: "Pide una estrella + un comentario con caso de uso.",
      recommendedWhen: "Martes o jueves entre 10:00 y 13:00 (hora local).",
    },
    {
      channel: "Reddit",
      hook: `Feedback request: ${snapshot.fullName}`,
      copy: `Estoy iterando ${snapshot.fullName} para ${goal}. Este es el problema que resuelve, cómo lo implementé y qué limitaciones quiero atacar esta semana.`,
      cta: "Solicita crítica técnica específica, no solo upvotes.",
      recommendedWhen: "Entre 16:00 y 20:00, adaptado al subreddit objetivo.",
    },
    {
      channel: "Hacker News",
      hook: `Show HN: ${snapshot.fullName}`,
      copy: `Construí ${snapshot.fullName} para resolver un cuello de botella concreto. Detallo arquitectura, decisiones de trade-off y qué métricas quiero mejorar en próximos 14 días.`,
      cta: "Incluye demo + aprendizaje técnico clave en el primer comentario.",
      recommendedWhen: "Días laborables por la mañana en horario US/EU.",
    },
    {
      channel: "dev.to",
      hook: `How I built ${snapshot.fullName}`,
      copy: `Post técnico sobre cómo diseñé ${snapshot.fullName}, qué falló al inicio y qué sistema de métricas uso para optimizar tracción de open source.`,
      cta: "Cierra con roadmap y llamada a contributors.",
      recommendedWhen: "Publicar al inicio de semana con actualización 48h después.",
    },
  ];
};

const buildMetrics = (snapshot: RepoSnapshot): RepoMetrics => ({
  fullName: snapshot.fullName,
  description: snapshot.description,
  stars: snapshot.stars,
  forks: snapshot.forks,
  watchers: snapshot.watchers,
  openIssues: snapshot.openIssues,
  topics: snapshot.topics,
  primaryLanguage: snapshot.primaryLanguage,
  license: snapshot.license,
  homepage: snapshot.homepage,
  hasRelease: snapshot.hasRelease,
  createdAt: snapshot.createdAt,
  pushedAt: snapshot.pushedAt,
});

/**
 * Construye un informe accionable a partir de la fotografía del repositorio.
 */
export const buildAuditReport = (
  snapshot: RepoSnapshot,
  objective: string,
  repoUrl: string,
): AuditResponse => {
  const readme = evaluateReadme(snapshot.readmeContent);
  const criteria = buildCriteria();

  const checks: AuditCheck[] = criteria.map((criterion) => {
    const result = criterion.evaluate(snapshot, readme);
    const points = Math.max(0, Math.min(criterion.weight, result.points));

    return {
      id: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      points,
      passed: points >= Math.ceil(criterion.weight * 0.75),
      detail: result.detail,
      suggestedAction: result.suggestedAction,
      priority: result.priority || prioritize(criterion.weight),
    };
  });

  const score = checks.reduce((acc, check) => acc + check.points, 0);
  const maxScore = checks.reduce((acc, check) => acc + check.weight, 0);

  const actions: PrioritizedAction[] = checks
    .filter((check) => check.points < check.weight)
    .sort((a, b) => {
      const priorityDelta = sortPriority(a.priority) - sortPriority(b.priority);
      if (priorityDelta !== 0) return priorityDelta;
      return b.weight - a.weight;
    })
    .slice(0, 6)
    .map((check) => ({
      title: check.label,
      description: check.suggestedAction,
      impact: `+${check.weight - check.points} puntos potenciales de score`,
      priority: check.priority,
    }));

  return {
    objective,
    repoUrl,
    score,
    maxScore,
    summary: buildSummary(score),
    metrics: buildMetrics(snapshot),
    checks,
    actions,
    distributionPlan: buildDistributionPlan(snapshot, objective),
  };
};
