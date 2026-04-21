import { describe, expect, it } from "vitest";
import {
  buildAuditHistoryEntry,
  findPreviousAuditForRepo,
  getScoreDelta,
  mergeAuditHistory,
  parseAuditHistory,
  type AuditHistoryEntry,
} from "@/lib/audit-history";
import type { AuditResponse } from "@/lib/types";

const buildReport = (overrides: Partial<AuditResponse> = {}): AuditResponse => ({
  objective: "Conseguir traccion",
  repoUrl: "https://github.com/acme/rocket",
  score: 74,
  maxScore: 100,
  summary: "Buen punto de partida.",
  metrics: {
    fullName: "acme/rocket",
    description: "Demo repo",
    stars: 120,
    forks: 14,
    watchers: 9,
    openIssues: 3,
    topics: ["launch"],
    primaryLanguage: "TypeScript",
    license: "MIT",
    homepage: "https://example.com",
    hasRelease: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    pushedAt: "2026-04-01T00:00:00.000Z",
  },
  checks: [],
  actions: [],
  distributionPlan: [],
  ...overrides,
});

const buildEntry = (
  id: string,
  repoFullName: string,
  score: number,
  createdAt: string,
): AuditHistoryEntry => ({
  id,
  repoFullName,
  repoUrl: `https://github.com/${repoFullName}`,
  objective: "Objetivo",
  score,
  maxScore: 100,
  stars: 10,
  forks: 1,
  openIssues: 0,
  createdAt,
});

describe("buildAuditHistoryEntry", () => {
  it("captures the fields needed for local trend tracking", () => {
    const entry = buildAuditHistoryEntry(buildReport(), "2026-04-21T10:00:00.000Z");

    expect(entry).toEqual({
      id: "acme/rocket-1776765600000",
      repoFullName: "acme/rocket",
      repoUrl: "https://github.com/acme/rocket",
      objective: "Conseguir traccion",
      score: 74,
      maxScore: 100,
      stars: 120,
      forks: 14,
      openIssues: 3,
      createdAt: "2026-04-21T10:00:00.000Z",
    });
  });
});

describe("mergeAuditHistory", () => {
  it("stores the newest audits first and enforces the configured limit", () => {
    const older = buildEntry("older", "acme/rocket", 62, "2026-04-20T10:00:00.000Z");
    const middle = buildEntry("middle", "acme/rocket", 68, "2026-04-21T09:00:00.000Z");
    const newest = buildEntry("newest", "acme/rocket", 74, "2026-04-21T10:00:00.000Z");

    const history = mergeAuditHistory([older, middle], newest, 2);

    expect(history.map((entry) => entry.id)).toEqual(["newest", "middle"]);
  });

  it("replaces duplicate ids instead of keeping stale copies", () => {
    const oldCopy = buildEntry("same", "acme/rocket", 62, "2026-04-20T10:00:00.000Z");
    const newCopy = buildEntry("same", "acme/rocket", 74, "2026-04-21T10:00:00.000Z");

    const history = mergeAuditHistory([oldCopy], newCopy);

    expect(history).toHaveLength(1);
    expect(history[0].score).toBe(74);
  });
});

describe("parseAuditHistory", () => {
  it("returns a safe sorted history and ignores malformed entries", () => {
    const raw = JSON.stringify([
      buildEntry("older", "acme/rocket", 62, "2026-04-20T10:00:00.000Z"),
      { id: "broken", score: 50 },
      buildEntry("newest", "acme/rocket", 74, "2026-04-21T10:00:00.000Z"),
    ]);

    const history = parseAuditHistory(raw);

    expect(history.map((entry) => entry.id)).toEqual(["newest", "older"]);
  });

  it("fails closed on invalid JSON", () => {
    expect(parseAuditHistory("{not-json")).toEqual([]);
  });
});

describe("findPreviousAuditForRepo", () => {
  it("returns the closest older audit for the same repository", () => {
    const older = buildEntry("older", "acme/rocket", 62, "2026-04-20T10:00:00.000Z");
    const middle = buildEntry("middle", "acme/rocket", 68, "2026-04-21T09:00:00.000Z");
    const current = buildEntry("current", "acme/rocket", 74, "2026-04-21T10:00:00.000Z");
    const otherRepo = buildEntry("other", "acme/other", 99, "2026-04-21T09:30:00.000Z");

    const previous = findPreviousAuditForRepo([current, older, otherRepo, middle], "acme/rocket", current);

    expect(previous?.id).toBe("middle");
  });
});

describe("getScoreDelta", () => {
  it("labels positive, negative, and neutral deltas", () => {
    expect(getScoreDelta(80, 74)).toEqual({
      value: 6,
      label: "+6 puntos",
      tone: "positive",
    });
    expect(getScoreDelta(70, 74)).toEqual({
      value: -4,
      label: "-4 puntos",
      tone: "negative",
    });
    expect(getScoreDelta(74, 74)).toEqual({
      value: 0,
      label: "sin cambios",
      tone: "neutral",
    });
  });
});
