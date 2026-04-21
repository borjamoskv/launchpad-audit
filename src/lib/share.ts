import type { RepoIdentifier } from "@/lib/github";

const SAFE_ROUTE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

export interface RepoShareUrlInput {
  appOrigin: string;
  repoFullName: string;
}

const safeDecodeSegment = (value: string): string | null => {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return null;
  }
};

const isSafeRouteSegment = (value: string): boolean => {
  return value.length > 0 && value.length <= 100 && SAFE_ROUTE_SEGMENT.test(value);
};

export const parseShareRouteParams = (ownerParam: string, repoParam: string): RepoIdentifier | null => {
  const owner = safeDecodeSegment(ownerParam);
  const repo = safeDecodeSegment(repoParam)?.replace(/\.git$/i, "");

  if (!owner || !repo || !isSafeRouteSegment(owner) || !isSafeRouteSegment(repo)) {
    return null;
  }

  return {
    owner,
    repo,
  };
};

export const buildGitHubRepoUrl = ({ owner, repo }: RepoIdentifier): string => {
  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
};

export const buildRepoSharePath = (repoFullName: string): string | null => {
  const [owner, repo, extra] = repoFullName.split("/");

  if (!owner || !repo || extra) {
    return null;
  }

  const parsed = parseShareRouteParams(owner, repo);

  if (!parsed) {
    return null;
  }

  return `/r/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`;
};

export const buildRepoShareUrl = ({ appOrigin, repoFullName }: RepoShareUrlInput): string | null => {
  const path = buildRepoSharePath(repoFullName);

  if (!path) {
    return null;
  }

  return new URL(path, appOrigin).toString();
};
