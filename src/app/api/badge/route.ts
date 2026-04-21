import { buildAuditReport } from "@/lib/audit";
import { buildScoreBadgeSvg } from "@/lib/badge";
import { loadRepoSnapshot, parseGitHubRepoUrl } from "@/lib/github";

const DEFAULT_OBJECTIVE = "Conseguir mas stars y feedback cualificado en 30 dias";

const svgResponse = (svg: string, status = 200): Response => {
  return new Response(svg, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
};

const buildErrorBadge = (label: string): string => {
  return buildScoreBadgeSvg({
    score: 0,
    maxScore: 100,
    repoFullName: label,
    label,
  });
};

const normalizeObjective = (value: string | null): string => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_OBJECTIVE;
  }

  return trimmed.slice(0, 180);
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const repoUrl = url.searchParams.get("repoUrl")?.trim() ?? "";

  if (!repoUrl) {
    return svgResponse(buildErrorBadge("missing repo"), 400);
  }

  const repoIdentifier = parseGitHubRepoUrl(repoUrl);

  if (!repoIdentifier) {
    return svgResponse(buildErrorBadge("invalid repo"), 400);
  }

  const repoSnapshot = await loadRepoSnapshot(repoIdentifier);

  if (!repoSnapshot.ok) {
    return svgResponse(buildErrorBadge("repo error"), repoSnapshot.status);
  }

  const report = buildAuditReport(repoSnapshot.data, normalizeObjective(url.searchParams.get("objective")), repoUrl);
  const svg = buildScoreBadgeSvg({
    score: report.score,
    maxScore: report.maxScore,
    repoFullName: report.metrics.fullName,
  });

  return svgResponse(svg);
}
