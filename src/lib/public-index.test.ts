import { describe, expect, it } from "vitest";
import {
  buildFeaturedRepoPath,
  EXPLORE_PATH,
  getFeaturedCategories,
  getFeaturedPublicRepoPaths,
  getFeaturedPublicRepos,
} from "@/lib/public-index";

describe("public repository index", () => {
  it("exposes an explore path", () => {
    expect(EXPLORE_PATH).toBe("/explore");
  });

  it("contains unique featured repositories with valid share paths", () => {
    const repos = getFeaturedPublicRepos();
    const fullNames = repos.map((repo) => repo.fullName);
    const paths = getFeaturedPublicRepoPaths();

    expect(repos.length).toBeGreaterThanOrEqual(12);
    expect(new Set(fullNames).size).toBe(fullNames.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((path) => path.startsWith("/r/"))).toBe(true);
    expect(paths).toContain("/r/vercel/next.js");
  });

  it("keeps featured repo metadata useful for a gallery card", () => {
    const [repo] = getFeaturedPublicRepos();

    expect(buildFeaturedRepoPath(repo)).toBe(`/r/${repo.fullName}`);
    expect(repo.description.length).toBeGreaterThan(20);
    expect(repo.whyAudit.length).toBeGreaterThan(20);
    expect(repo.tags.length).toBeGreaterThan(0);
  });

  it("derives stable sorted categories", () => {
    const categories = getFeaturedCategories();

    expect(categories).toEqual([...categories].sort((a, b) => a.localeCompare(b)));
    expect(categories).toContain("AI");
    expect(categories).toContain("Frontend");
  });
});
