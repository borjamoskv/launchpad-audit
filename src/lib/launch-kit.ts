import type { AuditResponse } from "@/lib/types";

export interface LaunchKitFile {
  path: string;
  title: string;
  description: string;
  content: string;
}

const repoNameFromFullName = (fullName: string): string => {
  const [, repoName] = fullName.split("/");
  return repoName || fullName;
};

const firstSentence = (value: string): string => {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "Sin descripcion" || trimmed === "Sin descripción") {
    return "Describe en una frase el problema principal que resuelve el proyecto.";
  }

  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
};

const topicLine = (topics: string[]): string => {
  if (topics.length === 0) {
    return "github, open-source, developer-tools";
  }

  return topics.slice(0, 8).join(", ");
};

const buildReadme = (report: AuditResponse): string => {
  const repoName = repoNameFromFullName(report.metrics.fullName);
  const description = firstSentence(report.metrics.description);
  const language = report.metrics.primaryLanguage ?? "TypeScript";
  const homepage = report.metrics.homepage || "TODO: añade una demo pública";

  return `# ${repoName}

${description}

## Por qué existe

Este proyecto está orientado a: **${report.objective}**.

## Demo

- Demo: ${homepage}
- Repo: ${report.repoUrl}

## Quickstart

\`\`\`bash
git clone ${report.repoUrl}
cd ${repoName}
# TODO: añade el comando real de instalación
npm install
npm run dev
\`\`\`

## Casos de uso

- Evalúa si el proyecto encaja con tu flujo en menos de 5 minutos.
- Reproduce el caso base localmente sin pasos ambiguos.
- Abre issues con contexto suficiente para que sean accionables.

## Stack

- Lenguaje principal: ${language}
- Topics: ${topicLine(report.metrics.topics)}

## Roadmap

- [ ] Publicar demo estable.
- [ ] Documentar el flujo principal con capturas o GIF.
- [ ] Añadir ejemplos reales de uso.
- [ ] Etiquetar issues para first contributors.

## Contribuir

Lee \`CONTRIBUTING.md\` antes de abrir una PR. Las contribuciones pequeñas y reproducibles tienen prioridad.

## Licencia

${report.metrics.license ? `Este proyecto usa licencia ${report.metrics.license}.` : "TODO: añade una licencia OSS explícita."}
`;
};

const buildContributing = (report: AuditResponse): string => {
  const repoName = repoNameFromFullName(report.metrics.fullName);

  return `# Contribuir a ${repoName}

## Setup local

\`\`\`bash
git clone ${report.repoUrl}
cd ${repoName}
npm install
npm run dev
\`\`\`

## Antes de abrir una PR

- Abre o enlaza un issue con el problema.
- Mantén la PR pequeña y enfocada.
- Añade pruebas cuando cambies lógica.
- Ejecuta \`npm run test\`, \`npm run lint\` y \`npm run build\`.

## Estilo de issues

Incluye contexto, pasos para reproducir, resultado esperado y resultado actual. Si propones una feature, explica el caso de uso concreto.
`;
};

const bugTemplate = `---
name: Bug report
about: Reporta un fallo reproducible
title: "[Bug]: "
labels: bug
assignees: ""
---

## Contexto

Describe qué estabas intentando hacer.

## Pasos para reproducir

1.
2.
3.

## Resultado esperado

Describe lo que debería ocurrir.

## Resultado actual

Describe lo que ocurre.

## Entorno

- Sistema operativo:
- Versión/runtime:
- Navegador, si aplica:
`;

const featureTemplate = `---
name: Feature request
about: Propón una mejora concreta
title: "[Feature]: "
labels: enhancement
assignees: ""
---

## Problema

Qué fricción o caso real resuelve esta mejora.

## Propuesta

Describe el comportamiento esperado.

## Alternativas consideradas

Qué otras opciones probaste o valoraste.

## Señal de impacto

Quién lo necesita y con qué frecuencia.
`;

const pullRequestTemplate = `## Qué cambia

Describe el cambio en 2-3 frases.

## Por qué

Issue relacionado o contexto.

## Checklist

- [ ] He probado el cambio localmente.
- [ ] He actualizado documentación si aplica.
- [ ] He añadido o ajustado tests si cambia lógica.
- [ ] La PR mantiene el alcance pequeño.
`;

const buildChangelog = (): string => `# Changelog

Todas las notas relevantes del proyecto se documentan aquí.

## Unreleased

### Added

- TODO: añade nuevas capacidades.

### Changed

- TODO: añade cambios relevantes.

### Fixed

- TODO: añade correcciones.
`;

export const buildLaunchKit = (report: AuditResponse): LaunchKitFile[] => [
  {
    path: "README.md",
    title: "README orientado a conversión",
    description: "Base con quickstart, demo, roadmap y contribución.",
    content: buildReadme(report),
  },
  {
    path: "CONTRIBUTING.md",
    title: "Guía de contribución",
    description: "Reduce fricción para contributors nuevos.",
    content: buildContributing(report),
  },
  {
    path: ".github/ISSUE_TEMPLATE/bug_report.md",
    title: "Template de bug",
    description: "Estandariza issues reproducibles.",
    content: bugTemplate,
  },
  {
    path: ".github/ISSUE_TEMPLATE/feature_request.md",
    title: "Template de feature",
    description: "Convierte ideas en propuestas comparables.",
    content: featureTemplate,
  },
  {
    path: ".github/pull_request_template.md",
    title: "Template de PR",
    description: "Checklist mínimo para calidad de cambios.",
    content: pullRequestTemplate,
  },
  {
    path: "CHANGELOG.md",
    title: "Changelog inicial",
    description: "Estructura para publicar progreso de forma creíble.",
    content: buildChangelog(),
  },
];
