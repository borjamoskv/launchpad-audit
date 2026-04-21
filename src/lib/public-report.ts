import { buildAuditReport } from "@/lib/audit";
import { loadRepoSnapshot } from "@/lib/github";
import {
  buildGitHubRepoUrl,
  buildRepoShareUrl,
  parseShareRouteParams,
} from "@/lib/share";
import type { AuditResponse } from "@/lib/types";

export const DEFAULT_PUBLIC_OBJECTIVE = "Conseguir mas stars y feedback cualificado en 30 dias";
export const DEFAULT_APP_ORIGIN = "https://launchpad-audit.vercel.app";
export const PUBLIC_REPORT_REVALIDATE_SECONDS = 30 * 60;

export interface PublicReportFreshness {
  label: string;
  revalidateSeconds: number;
}

export interface PublicReportSuccess {
  ok: true;
  report: AuditResponse;
  shareUrl: string;
  freshness: PublicReportFreshness;
}

export interface PublicReportFailure {
  ok: false;
  status: number;
  error: string;
  repoUrl?: string;
}

export type PublicReportResult = PublicReportSuccess | PublicReportFailure;

export const getAppOrigin = (): string => {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_ORIGIN;
};

export const buildPublicReportImageUrl = (shareUrl: string): string => {
  return new URL("opengraph-image", shareUrl.endsWith("/") ? shareUrl : `${shareUrl}/`).toString();
};

export const formatRevalidateWindow = (seconds: number): string => {
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return `${hours} ${hours === 1 ? "hora" : "horas"}`;
  }

  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} min`;
  }

  return `${seconds} s`;
};

export const buildPublicReportFreshness = (
  revalidateSeconds = PUBLIC_REPORT_REVALIDATE_SECONDS,
): PublicReportFreshness => {
  return {
    label: `GitHub público, cacheado hasta ${formatRevalidateWindow(revalidateSeconds)}. No usa tokens privados.`,
    revalidateSeconds,
  };
};

export const loadPublicRepoReport = async (
  ownerParam: string,
  repoParam: string,
): Promise<PublicReportResult> => {
  const repoIdentifier = parseShareRouteParams(ownerParam, repoParam);

  if (!repoIdentifier) {
    return {
      ok: false,
      status: 400,
      error: "Ruta de repositorio no válida.",
    };
  }

  const repoUrl = buildGitHubRepoUrl(repoIdentifier);
  const repoSnapshot = await loadRepoSnapshot(repoIdentifier, undefined, {
    allowEnvToken: false,
    revalidateSeconds: PUBLIC_REPORT_REVALIDATE_SECONDS,
  });

  if (!repoSnapshot.ok) {
    return {
      ok: false,
      status: repoSnapshot.status,
      error: repoSnapshot.error,
      repoUrl,
    };
  }

  const report = buildAuditReport(repoSnapshot.data, DEFAULT_PUBLIC_OBJECTIVE, repoUrl);
  const shareUrl = buildRepoShareUrl({
    appOrigin: getAppOrigin(),
    repoFullName: report.metrics.fullName,
  });

  return {
    ok: true,
    report,
    shareUrl: shareUrl ?? getAppOrigin(),
    freshness: buildPublicReportFreshness(),
  };
};
