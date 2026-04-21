import { describe, expect, it } from "vitest";
import { getFeaturedPublicRepos } from "@/lib/public-index";
import {
  ALL_FEATURED_CATEGORIES,
  filterFeaturedRepos,
  normalizeExploreQuery,
} from "@/lib/public-index-filter";

const repos = getFeaturedPublicRepos();

describe("normalizeExploreQuery", () => {
  it("normalizes user search input", () => {
    expect(normalizeExploreQuery("  OpenAI Python  ")).toBe("openai python");
  });
});

describe("filterFeaturedRepos", () => {
  it("returns every repo for empty filters", () => {
    expect(
      filterFeaturedRepos(repos, {
        query: "",
        category: ALL_FEATURED_CATEGORIES,
      }),
    ).toHaveLength(repos.length);
  });

  it("filters by category", () => {
    const aiRepos = filterFeaturedRepos(repos, {
      query: "",
      category: "AI",
    });

    expect(aiRepos.length).toBeGreaterThan(0);
    expect(aiRepos.every((repo) => repo.category === "AI")).toBe(true);
  });

  it("searches across name, description, reason and tags", () => {
    const sdkRepos = filterFeaturedRepos(repos, {
      query: "sdk",
      category: ALL_FEATURED_CATEGORIES,
    });

    expect(sdkRepos.map((repo) => repo.fullName)).toContain("openai/openai-python");
  });

  it("combines query and category", () => {
    const filtered = filterFeaturedRepos(repos, {
      query: "runtime",
      category: "Runtime",
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((repo) => repo.category === "Runtime")).toBe(true);
    expect(filtered.map((repo) => repo.fullName)).toContain("nodejs/node");
  });

  it("returns an empty list when nothing matches", () => {
    expect(
      filterFeaturedRepos(repos, {
        query: "definitely-not-indexed",
        category: ALL_FEATURED_CATEGORIES,
      }),
    ).toEqual([]);
  });
});
