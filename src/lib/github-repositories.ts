interface GitHubRepositoryPayload {
  full_name: string;
  html_url: string;
  private: boolean;
  stargazers_count: number;
  pushed_at: string;
  language: string | null;
}

interface GitHubApiSuccess<T> {
  ok: true;
  data: T;
}

interface GitHubApiFailure {
  ok: false;
  status: number;
  error: string;
}

export type GitHubRepositoryResult<T> = GitHubApiSuccess<T> | GitHubApiFailure;

export interface GitHubRepositoryOption {
  fullName: string;
  htmlUrl: string;
  isPrivate: boolean;
  stars: number;
  pushedAt: string;
  language: string | null;
}

const buildHeaders = (token: string): HeadersInit => ({
  Accept: "application/vnd.github+json",
  "User-Agent": "launchpad-audit",
  Authorization: `Bearer ${token}`,
});

const normalizeRepository = (repo: GitHubRepositoryPayload): GitHubRepositoryOption => ({
  fullName: repo.full_name,
  htmlUrl: repo.html_url,
  isPrivate: repo.private,
  stars: repo.stargazers_count,
  pushedAt: repo.pushed_at,
  language: repo.language,
});

export const listGitHubRepositories = async (
  token: string,
): Promise<GitHubRepositoryResult<GitHubRepositoryOption[]>> => {
  try {
    const url = new URL("https://api.github.com/user/repos");
    url.searchParams.set("per_page", "50");
    url.searchParams.set("sort", "pushed");
    url.searchParams.set("direction", "desc");
    url.searchParams.set("affiliation", "owner,collaborator,organization_member");

    const response = await fetch(url, {
      headers: buildHeaders(token),
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      let message = "No se pudieron cargar los repositorios de GitHub.";

      try {
        const payload = (await response.json()) as { message?: string };
        message = payload.message || message;
      } catch {
        // Preserve the stable response shape even if GitHub returns non-JSON.
      }

      return {
        ok: false,
        status: response.status,
        error: message,
      };
    }

    const payload = (await response.json()) as GitHubRepositoryPayload[];

    return {
      ok: true,
      data: payload.map(normalizeRepository),
    };
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Error de red al cargar repositorios de GitHub.",
    };
  }
};
