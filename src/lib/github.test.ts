import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGitHubRequestInit, parseGitHubRepoUrl } from "@/lib/github";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parseGitHubRepoUrl", () => {
  it("acepta URL HTTPS estándar", () => {
    expect(parseGitHubRepoUrl("https://github.com/vercel/next.js")).toEqual({
      owner: "vercel",
      repo: "next.js",
    });
  });

  it("acepta URL SSH", () => {
    expect(parseGitHubRepoUrl("git@github.com:owner/repo.git")).toEqual({
      owner: "owner",
      repo: "repo",
    });
  });

  it("rechaza hosts distintos de github.com", () => {
    expect(parseGitHubRepoUrl("https://gitlab.com/owner/repo")).toBeNull();
  });

  it("rechaza valores sin owner/repo", () => {
    expect(parseGitHubRepoUrl("https://github.com/owner")).toBeNull();
  });
});

describe("buildGitHubRequestInit", () => {
  it("permite caché pública cuando no hay token", () => {
    const init = buildGitHubRequestInit({
      allowEnvToken: false,
      revalidateSeconds: 1800,
    });

    expect(init.cache).toBeUndefined();
    expect(init.next?.revalidate).toBe(1800);
    expect(init.headers).toEqual({
      Accept: "application/vnd.github+json",
      "User-Agent": "launchpad-audit",
    });
  });

  it("no usa GITHUB_TOKEN cuando la llamada pública lo desactiva", () => {
    vi.stubEnv("GITHUB_TOKEN", "ghp_secret");

    const init = buildGitHubRequestInit({
      allowEnvToken: false,
      revalidateSeconds: 1800,
    });

    expect(JSON.stringify(init.headers)).not.toContain("Authorization");
  });

  it("desactiva caché para llamadas autenticadas", () => {
    const init = buildGitHubRequestInit({
      authToken: "ghp_inline",
      revalidateSeconds: 1800,
    });

    expect(init.cache).toBe("no-store");
    expect(init.next).toBeUndefined();
    expect(init.headers).toEqual({
      Accept: "application/vnd.github+json",
      "User-Agent": "launchpad-audit",
      Authorization: "Bearer ghp_inline",
    });
  });
});
