interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiFailure {
  ok: false;
  status: number;
  error: string;
}

type ApiResult<T> = ApiSuccess<T> | ApiFailure;

interface GitHubRepoResponse {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  subscribers_count: number;
  open_issues_count: number;
  topics: string[];
  language: string | null;
  license: {
    name: string;
    spdx_id: string | null;
  } | null;
  homepage: string | null;
  default_branch: string;
  created_at: string;
  pushed_at: string;
}

interface GitHubReadmeResponse {
  content: string;
  encoding: string;
}

interface GitHubTreeResponse {
  tree: Array<{
    path: string;
    type: string;
  }>;
}

interface GitHubRequestOptions {
  authToken?: string;
}

export interface RepoIdentifier {
  owner: string;
  repo: string;
}

export interface RepoSnapshot {
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  topics: string[];
  primaryLanguage: string | null;
  license: string | null;
  homepage: string | null;
  hasRelease: boolean;
  readmeContent: string | null;
  hasContributing: boolean;
  hasIssueTemplates: boolean;
  hasPullRequestTemplate: boolean;
  hasCodeOfConduct: boolean;
  hasChangelog: boolean;
  createdAt: string;
  pushedAt: string;
}

const GITHUB_API_BASE = "https://api.github.com";

const DEFAULT_ERROR_MESSAGE = "GitHub no respondió con un formato esperado.";

const normalizePath = (path: string): string => path.toLowerCase();

const decodeBase64 = (value: string): string => Buffer.from(value.replace(/\n/g, ""), "base64").toString("utf-8");

const hasAnyPath = (pathSet: Set<string>, candidates: string[]): boolean => {
  return candidates.some((candidate) => pathSet.has(normalizePath(candidate)));
};

const hasPrefix = (pathSet: Set<string>, prefix: string): boolean => {
  const normalizedPrefix = normalizePath(prefix);

  for (const path of pathSet) {
    if (path.startsWith(normalizedPrefix)) {
      return true;
    }
  }

  return false;
};

const pickAuthToken = (candidate?: string): string | undefined => {
  const inlineToken = candidate?.trim();

  if (inlineToken) {
    return inlineToken;
  }

  const envToken = process.env.GITHUB_TOKEN?.trim();
  return envToken || undefined;
};

const buildHeaders = (authToken?: string): HeadersInit => {
  const token = pickAuthToken(authToken);

  if (!token) {
    return {
      Accept: "application/vnd.github+json",
      "User-Agent": "launchpad-audit",
    };
  }

  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "launchpad-audit",
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Convierte una URL de GitHub a owner/repo.
 */
export const parseGitHubRepoUrl = (rawUrl: string): RepoIdentifier | null => {
  const cleaned = rawUrl.trim();

  if (!cleaned) {
    return null;
  }

  try {
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      const url = new URL(cleaned);
      const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();

      if (hostname !== "github.com") {
        return null;
      }

      const [owner, repoSegment] = url.pathname.split("/").filter(Boolean);

      if (!owner || !repoSegment) {
        return null;
      }

      return {
        owner,
        repo: repoSegment.replace(/\.git$/i, ""),
      };
    }
  } catch {
    return null;
  }

  const sshMatch = cleaned.match(/github\.com[:/]([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i);

  if (!sshMatch) {
    return null;
  }

  return {
    owner: sshMatch[1],
    repo: sshMatch[2],
  };
};

const githubRequest = async <T>(path: string, options: GitHubRequestOptions = {}): Promise<ApiResult<T>> => {
  try {
    const response = await fetch(`${GITHUB_API_BASE}${path}`, {
      headers: buildHeaders(options.authToken),
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
        return {
          ok: false,
          status: 429,
          error: "Límite de peticiones de GitHub alcanzado. Espera unos minutos e inténtalo de nuevo.",
        };
      }

      if (response.status === 404) {
        return {
          ok: false,
          status: 404,
          error: "Repositorio no encontrado o no es público.",
        };
      }

      let message = DEFAULT_ERROR_MESSAGE;

      try {
        const errorBody = (await response.json()) as { message?: string };

        if (errorBody.message) {
          message = errorBody.message;
        }
      } catch {
        // Ignore parse issues to keep stable error reporting.
      }

      return {
        ok: false,
        status: response.status,
        error: message,
      };
    }

    const payload = (await response.json()) as T;

    return {
      ok: true,
      data: payload,
    };
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Error de red al consultar GitHub.",
    };
  }
};

const probeFileExists = async (
  owner: string,
  repo: string,
  filePath: string,
  options: GitHubRequestOptions,
): Promise<boolean> => {
  const encodedPath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const result = await githubRequest<unknown>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`,
    options,
  );

  return result.ok;
};

const loadPathSet = async (
  owner: string,
  repo: string,
  defaultBranch: string,
  options: GitHubRequestOptions,
): Promise<Set<string>> => {
  const treeResult = await githubRequest<GitHubTreeResponse>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
    options,
  );

  if (treeResult.ok) {
    return new Set(
      treeResult.data.tree.filter((entry) => entry.type === "blob").map((entry) => normalizePath(entry.path)),
    );
  }

  const fallbackChecks = await Promise.all([
    probeFileExists(owner, repo, "CONTRIBUTING.md", options),
    probeFileExists(owner, repo, ".github/ISSUE_TEMPLATE/config.yml", options),
    probeFileExists(owner, repo, ".github/pull_request_template.md", options),
    probeFileExists(owner, repo, "CODE_OF_CONDUCT.md", options),
    probeFileExists(owner, repo, "CHANGELOG.md", options),
  ]);

  const fallbackPaths = new Set<string>();

  if (fallbackChecks[0]) fallbackPaths.add(normalizePath("CONTRIBUTING.md"));
  if (fallbackChecks[1]) fallbackPaths.add(normalizePath(".github/ISSUE_TEMPLATE/config.yml"));
  if (fallbackChecks[2]) fallbackPaths.add(normalizePath(".github/pull_request_template.md"));
  if (fallbackChecks[3]) fallbackPaths.add(normalizePath("CODE_OF_CONDUCT.md"));
  if (fallbackChecks[4]) fallbackPaths.add(normalizePath("CHANGELOG.md"));

  return fallbackPaths;
};

/**
 * Carga metadatos públicos de un repositorio para ejecutar la auditoría.
 */
export const loadRepoSnapshot = async (
  identifier: RepoIdentifier,
  authToken?: string,
): Promise<ApiResult<RepoSnapshot>> => {
  const options: GitHubRequestOptions = {
    authToken,
  };

  const repoResponse = await githubRequest<GitHubRepoResponse>(
    `/repos/${encodeURIComponent(identifier.owner)}/${encodeURIComponent(identifier.repo)}`,
    options,
  );

  if (!repoResponse.ok) {
    return repoResponse;
  }

  const repoData = repoResponse.data;

  const [readmeResponse, releaseResponse, pathSet] = await Promise.all([
    githubRequest<GitHubReadmeResponse>(
      `/repos/${encodeURIComponent(identifier.owner)}/${encodeURIComponent(identifier.repo)}/readme`,
      options,
    ),
    githubRequest<unknown[]>(
      `/repos/${encodeURIComponent(identifier.owner)}/${encodeURIComponent(identifier.repo)}/releases?per_page=1`,
      options,
    ),
    loadPathSet(identifier.owner, identifier.repo, repoData.default_branch, options),
  ]);

  const hasIssueTemplateFolder = hasPrefix(pathSet, ".github/issue_template/");

  const hasIssueTemplates =
    hasIssueTemplateFolder ||
    hasAnyPath(pathSet, [".github/issue_template.md", "issue_template.md", ".github/issue_template/config.yml"]);

  const hasPullRequestTemplate = hasAnyPath(pathSet, [
    ".github/pull_request_template.md",
    "pull_request_template.md",
    "docs/pull_request_template.md",
  ]);

  const hasContributing = hasAnyPath(pathSet, [
    "contributing.md",
    "docs/contributing.md",
    ".github/contributing.md",
  ]);

  const hasCodeOfConduct = hasAnyPath(pathSet, [
    "code_of_conduct.md",
    ".github/code_of_conduct.md",
    "docs/code_of_conduct.md",
  ]);

  const hasChangelog = hasAnyPath(pathSet, [
    "changelog.md",
    "changes.md",
    "docs/changelog.md",
    ".github/changelog.md",
  ]);

  const readmeContent = readmeResponse.ok && readmeResponse.data.encoding === "base64"
    ? decodeBase64(readmeResponse.data.content)
    : null;

  const hasRelease = releaseResponse.ok && releaseResponse.data.length > 0;

  return {
    ok: true,
    data: {
      fullName: repoData.full_name,
      description: repoData.description ?? "Sin descripción",
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.subscribers_count,
      openIssues: repoData.open_issues_count,
      topics: repoData.topics ?? [],
      primaryLanguage: repoData.language,
      license: repoData.license?.spdx_id ?? repoData.license?.name ?? null,
      homepage: repoData.homepage,
      hasRelease,
      readmeContent,
      hasContributing,
      hasIssueTemplates,
      hasPullRequestTemplate,
      hasCodeOfConduct,
      hasChangelog,
      createdAt: repoData.created_at,
      pushedAt: repoData.pushed_at,
    },
  };
};
