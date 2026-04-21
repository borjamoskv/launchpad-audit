import type { AuditCheck, AuditResponse, PriorityLevel } from "@/lib/types";

const priorityLabel: Record<PriorityLevel, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const renderTopics = (topics: string[]): string => {
  if (topics.length === 0) {
    return "Sin topics";
  }

  return topics.map((topic) => `\`${topic}\``).join(", ");
};

const renderCheckRow = (check: AuditCheck): string => {
  const status = check.passed ? "OK" : "Pendiente";
  return `| ${check.label} | ${status} | ${check.points}/${check.weight} | ${priorityLabel[check.priority]} | ${check.detail} |`;
};

const escapeTableValue = (value: string): string => {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
};

export const buildAuditMarkdownReport = (report: AuditResponse): string => {
  const checks = report.checks.map((check) => ({
    ...check,
    label: escapeTableValue(check.label),
    detail: escapeTableValue(check.detail),
  }));

  const actions = report.actions.length > 0
    ? report.actions
        .map(
          (action, index) =>
            `${index + 1}. **${action.title}** (${priorityLabel[action.priority]}): ${action.description} _${action.impact}_`,
        )
        .join("\n")
    : "No hay acciones urgentes. Prioriza distribución y seguimiento.";

  const distribution = report.distributionPlan
    .map(
      (post) =>
        `### ${post.channel}\n\n**Hook:** ${post.hook}\n\n${post.copy}\n\n**CTA:** ${post.cta}\n\n**Cuándo:** ${post.recommendedWhen}`,
    )
    .join("\n\n");

  return `# Launchpad Audit: ${report.metrics.fullName}

**Repositorio:** ${report.repoUrl}

**Objetivo:** ${report.objective}

**Score:** ${report.score}/${report.maxScore}

${report.summary}

## Métricas

- Stars: ${report.metrics.stars}
- Forks: ${report.metrics.forks}
- Watchers: ${report.metrics.watchers}
- Open issues: ${report.metrics.openIssues}
- Lenguaje principal: ${report.metrics.primaryLanguage ?? "N/D"}
- Licencia: ${report.metrics.license ?? "No detectada"}
- Homepage: ${report.metrics.homepage ?? "No configurada"}
- Topics: ${renderTopics(report.metrics.topics)}

## Acciones Prioritarias

${actions}

## Checklist

| Check | Estado | Puntos | Prioridad | Detalle |
| --- | --- | --- | --- | --- |
${checks.map(renderCheckRow).join("\n")}

## Plan de Distribución

${distribution}

## Próximo Paso

Aplica primero las acciones de prioridad alta, publica una demo si no existe y usa el Launch kit para abrir una PR de onboarding.

---

Generado con Launchpad Audit.
`;
};
