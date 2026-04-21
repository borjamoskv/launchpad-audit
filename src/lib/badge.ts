import type { AuditResponse } from "@/lib/types";

const BADGE_HEIGHT = 22;
const TEXT_Y = 15;

export interface ScoreBadgeInput {
  score: number;
  maxScore: number;
  repoFullName?: string;
  label?: string;
}

export interface BadgeMarkdownInput {
  appOrigin: string;
  report: AuditResponse;
}

const clampScore = (score: number, maxScore: number): number => {
  const safeMax = Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 100;
  const safeScore = Number.isFinite(score) ? score : 0;

  return Math.max(0, Math.min(safeMax, Math.round(safeScore)));
};

const estimateTextWidth = (value: string): number => {
  return Math.max(38, Math.ceil(value.length * 6.6 + 14));
};

export const escapeSvgText = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export const getScoreBadgeColor = (score: number, maxScore: number): string => {
  const safeMax = Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 100;
  const ratio = clampScore(score, safeMax) / safeMax;

  if (ratio >= 0.8) return "#047857";
  if (ratio >= 0.6) return "#0284c7";
  if (ratio >= 0.4) return "#d97706";
  return "#be123c";
};

export const buildScoreBadgeSvg = ({
  score,
  maxScore,
  repoFullName = "repository",
  label = "launchpad",
}: ScoreBadgeInput): string => {
  const safeMax = Number.isFinite(maxScore) && maxScore > 0 ? Math.round(maxScore) : 100;
  const safeScore = clampScore(score, safeMax);
  const leftText = label.trim() || "launchpad";
  const rightText = `${safeScore}/${safeMax}`;
  const leftWidth = estimateTextWidth(leftText);
  const rightWidth = estimateTextWidth(rightText);
  const width = leftWidth + rightWidth;
  const rightColor = getScoreBadgeColor(safeScore, safeMax);
  const accessibleLabel = `${leftText}: ${rightText}`;
  const title = `Launchpad Audit score for ${repoFullName}: ${rightText}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${BADGE_HEIGHT}" viewBox="0 0 ${width} ${BADGE_HEIGHT}" role="img" aria-label="${escapeSvgText(accessibleLabel)}">
  <title>${escapeSvgText(title)}</title>
  <linearGradient id="badge-shine" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".18"/>
    <stop offset="1" stop-color="#000" stop-opacity=".08"/>
  </linearGradient>
  <clipPath id="badge-radius">
    <rect width="${width}" height="${BADGE_HEIGHT}" rx="4" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#badge-radius)">
    <rect width="${leftWidth}" height="${BADGE_HEIGHT}" fill="#0f172a"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="${BADGE_HEIGHT}" fill="${rightColor}"/>
    <rect width="${width}" height="${BADGE_HEIGHT}" fill="url(#badge-shine)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="11" font-weight="700">
    <text x="${leftWidth / 2}" y="${TEXT_Y}" fill="#010101" fill-opacity=".3">${escapeSvgText(leftText)}</text>
    <text x="${leftWidth / 2}" y="${TEXT_Y - 1}">${escapeSvgText(leftText)}</text>
    <text x="${leftWidth + rightWidth / 2}" y="${TEXT_Y}" fill="#010101" fill-opacity=".3">${escapeSvgText(rightText)}</text>
    <text x="${leftWidth + rightWidth / 2}" y="${TEXT_Y - 1}">${escapeSvgText(rightText)}</text>
  </g>
</svg>`;
};

export const buildReadmeBadgeMarkdown = ({ appOrigin, report }: BadgeMarkdownInput): string => {
  const badgeUrl = new URL("/api/badge", appOrigin);
  badgeUrl.searchParams.set("repoUrl", report.repoUrl);

  return `[![Launchpad Score](${badgeUrl.toString()})](${appOrigin})`;
};
