import { describe, expect, it } from "vitest";
import { parseGitHubRepoUrl } from "@/lib/github";

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
