import { afterEach, describe, expect, it, vi } from "vitest";
import { listGitHubRepositories } from "@/lib/github-repositories";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listGitHubRepositories", () => {
  it("normaliza repositorios de GitHub para el selector", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            full_name: "acme/launchpad",
            html_url: "https://github.com/acme/launchpad",
            private: false,
            stargazers_count: 42,
            pushed_at: "2026-04-21T00:00:00.000Z",
            language: "TypeScript",
          },
        ],
      })),
    );

    const result = await listGitHubRepositories("token");

    expect(result).toEqual({
      ok: true,
      data: [
        {
          fullName: "acme/launchpad",
          htmlUrl: "https://github.com/acme/launchpad",
          isPrivate: false,
          stars: 42,
          pushedAt: "2026-04-21T00:00:00.000Z",
          language: "TypeScript",
        },
      ],
    });
  });

  it("devuelve error estable cuando GitHub rechaza la petición", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 403,
        json: async () => ({ message: "Bad credentials" }),
      })),
    );

    const result = await listGitHubRepositories("token");

    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "Bad credentials",
    });
  });
});
