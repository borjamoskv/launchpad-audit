import type { AuditResponse } from "@/lib/types";

export const AUDIT_HISTORY_LIMIT = 12;

export interface AuditHistoryEntry {
  id: string;
  repoFullName: string;
  repoUrl: string;
  objective: string;
  score: number;
  maxScore: number;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
}

export interface ScoreDelta {
  value: number;
  label: string;
  tone: "positive" | "neutral" | "negative";
}

const normalizeIsoDate = (dateLike: string): string => {
  const parsed = new Date(dateLike);

  if (Number.isNaN(parsed.getTime())) {
    return new Date(0).toISOString();
  }

  return parsed.toISOString();
};

const getEntryTime = (entry: AuditHistoryEntry): number => {
  const timestamp = Date.parse(entry.createdAt);

  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readString = (value: unknown): string | null => {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const readFiniteNumber = (value: unknown): number | null => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const parseAuditHistoryEntry = (value: unknown): AuditHistoryEntry | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const repoFullName = readString(value.repoFullName);
  const repoUrl = readString(value.repoUrl);
  const objective = typeof value.objective === "string" ? value.objective : "";
  const score = readFiniteNumber(value.score);
  const maxScore = readFiniteNumber(value.maxScore);
  const stars = readFiniteNumber(value.stars);
  const forks = readFiniteNumber(value.forks);
  const openIssues = readFiniteNumber(value.openIssues);
  const createdAt = readString(value.createdAt);

  if (
    !id ||
    !repoFullName ||
    !repoUrl ||
    score === null ||
    maxScore === null ||
    stars === null ||
    forks === null ||
    openIssues === null ||
    !createdAt
  ) {
    return null;
  }

  return {
    id,
    repoFullName,
    repoUrl,
    objective,
    score,
    maxScore,
    stars,
    forks,
    openIssues,
    createdAt: normalizeIsoDate(createdAt),
  };
};

export const buildAuditHistoryEntry = (
  report: AuditResponse,
  createdAt = new Date().toISOString(),
): AuditHistoryEntry => {
  const normalizedCreatedAt = normalizeIsoDate(createdAt);
  const timestamp = Date.parse(normalizedCreatedAt);
  const repoKey = report.metrics.fullName.replace(/[^a-zA-Z0-9._/-]/g, "-");

  return {
    id: `${repoKey}-${timestamp}`,
    repoFullName: report.metrics.fullName,
    repoUrl: report.repoUrl,
    objective: report.objective,
    score: report.score,
    maxScore: report.maxScore,
    stars: report.metrics.stars,
    forks: report.metrics.forks,
    openIssues: report.metrics.openIssues,
    createdAt: normalizedCreatedAt,
  };
};

export const mergeAuditHistory = (
  history: AuditHistoryEntry[],
  entry: AuditHistoryEntry,
  limit = AUDIT_HISTORY_LIMIT,
): AuditHistoryEntry[] => {
  const normalizedLimit = Math.max(0, Math.floor(limit));
  const uniqueEntries = [entry, ...history.filter((item) => item.id !== entry.id)];

  return uniqueEntries
    .sort((left, right) => getEntryTime(right) - getEntryTime(left))
    .slice(0, normalizedLimit);
};

export const parseAuditHistory = (raw: string, limit = AUDIT_HISTORY_LIMIT): AuditHistoryEntry[] => {
  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(parseAuditHistoryEntry)
      .filter((entry): entry is AuditHistoryEntry => entry !== null)
      .sort((left, right) => getEntryTime(right) - getEntryTime(left))
      .slice(0, Math.max(0, Math.floor(limit)));
  } catch {
    return [];
  }
};

export const findPreviousAuditForRepo = (
  history: AuditHistoryEntry[],
  repoFullName: string,
  currentEntry?: AuditHistoryEntry | null,
): AuditHistoryEntry | null => {
  const currentTime = currentEntry ? getEntryTime(currentEntry) : Number.POSITIVE_INFINITY;

  return (
    history
      .filter(
        (entry) =>
          entry.repoFullName === repoFullName &&
          entry.id !== currentEntry?.id &&
          getEntryTime(entry) < currentTime,
      )
      .sort((left, right) => getEntryTime(right) - getEntryTime(left))[0] ?? null
  );
};

export const getScoreDelta = (currentScore: number, previousScore: number): ScoreDelta => {
  const value = currentScore - previousScore;

  if (value > 0) {
    return {
      value,
      label: `+${value} puntos`,
      tone: "positive",
    };
  }

  if (value < 0) {
    return {
      value,
      label: `${value} puntos`,
      tone: "negative",
    };
  }

  return {
    value,
    label: "sin cambios",
    tone: "neutral",
  };
};
