import type { AuditResponse, PrioritizedAction } from "@/lib/types";

export interface LaunchSprintStep {
  day: number;
  title: string;
  description: string;
  outcome: string;
}

const fallbackAction = (title: string, description: string, impact: string): PrioritizedAction => ({
  title,
  description,
  impact,
  priority: "medium",
});

const pickAction = (
  actions: PrioritizedAction[],
  index: number,
  fallback: PrioritizedAction,
): PrioritizedAction => {
  return actions[index] ?? fallback;
};

export const buildLaunchSprint = (report: AuditResponse): LaunchSprintStep[] => {
  const firstAction = pickAction(
    report.actions,
    0,
    fallbackAction(
      "Refinar narrativa del README",
      "Convierte el README en una landing: problema, demo, quickstart y llamada clara a contribuir.",
      "+5 puntos potenciales de conversión",
    ),
  );
  const secondAction = pickAction(
    report.actions,
    1,
    fallbackAction(
      "Convertir interés en feedback",
      "Abre issues guiadas para recopilar casos reales, bugs y objeciones de usuarios tempranos.",
      "+3 señales de feedback cualificado",
    ),
  );
  const primaryPost = report.distributionPlan[0];
  const secondaryPost = report.distributionPlan[1] ?? report.distributionPlan[0];

  return [
    {
      day: 1,
      title: `Corregir: ${firstAction.title}`,
      description: firstAction.description,
      outcome: firstAction.impact,
    },
    {
      day: 2,
      title: `Corregir: ${secondAction.title}`,
      description: secondAction.description,
      outcome: secondAction.impact,
    },
    {
      day: 3,
      title: "Instalar prueba social visible",
      description: `Pega el badge de Launchpad Score y enlaza la página pública de ${report.metrics.fullName} desde el README.`,
      outcome: "El repo comunica estado y progreso sin explicar la herramienta manualmente.",
    },
    {
      day: 4,
      title: primaryPost ? `Publicar en ${primaryPost.channel}` : "Publicar primer anuncio",
      description: primaryPost
        ? `${primaryPost.hook}. ${primaryPost.cta}`
        : "Publica un hilo corto con problema, demo, aprendizaje técnico y petición de feedback.",
      outcome: "Primera ola de tráfico cualificado hacia GitHub.",
    },
    {
      day: 5,
      title: secondaryPost ? `Recoger objeciones en ${secondaryPost.channel}` : "Recoger objeciones",
      description: secondaryPost
        ? `${secondaryPost.copy} ${secondaryPost.cta}`
        : "Pide crítica técnica específica y transforma objeciones repetidas en issues.",
      outcome: "Backlog real construido desde usuarios, no desde suposiciones.",
    },
    {
      day: 6,
      title: "Abrir Launch kit PR",
      description: "Genera o actualiza README, CONTRIBUTING, templates y CHANGELOG con el Launch kit.",
      outcome: "Onboarding listo para convertir visitantes en contributors.",
    },
    {
      day: 7,
      title: "Medir y relanzar",
      description: `Reaudita ${report.metrics.fullName}, compara score, stars, forks e issues abiertos, y publica el delta.`,
      outcome: "Ciclo semanal de mejora visible para la comunidad.",
    },
  ];
};
