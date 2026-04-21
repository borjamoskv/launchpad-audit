import { describe, expect, it } from "vitest";
import {
  buildGitHubRepoUrl,
  buildRepoSharePath,
  buildRepoShareUrl,
  parseShareRouteParams,
} from "@/lib/share";

describe("parseShareRouteParams", () => {
  it("normalizes safe owner and repo route params", () => {
    expect(parseShareRouteParams("vercel", "next.js")).toEqual({
      owner: "vercel",
      repo: "next.js",
    });
  });

  it("rejects unsafe or malformed params", () => {
    expect(parseShareRouteParams("vercel", "../next")).toBeNull();
    expect(parseShareRouteParams("vercel", "next/js")).toBeNull();
    expect(parseShareRouteParams("", "repo")).toBeNull();
  });
});

describe("buildGitHubRepoUrl", () => {
  it("builds a canonical GitHub URL", () => {
    expect(buildGitHubRepoUrl({ owner: "vercel", repo: "next.js" })).toBe(
      "https://github.com/vercel/next.js",
    );
  });
});

describe("buildRepoSharePath", () => {
  it("builds a share route for full repo names", () => {
    expect(buildRepoSharePath("vercel/next.js")).toBe("/r/vercel/next.js");
  });

  it("returns null for invalid full repo names", () => {
    expect(buildRepoSharePath("vercel")).toBeNull();
    expect(buildRepoSharePath("vercel/next.js/extra")).toBeNull();
  });
});

describe("buildRepoShareUrl", () => {
  it("builds an absolute public share URL", () => {
    expect(
      buildRepoShareUrl({
        appOrigin: "https://launchpad-audit.vercel.app",
        repoFullName: "vercel/next.js",
      }),
    ).toBe("https://launchpad-audit.vercel.app/r/vercel/next.js");
  });
});
