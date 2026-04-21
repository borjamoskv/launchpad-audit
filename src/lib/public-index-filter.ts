import type { FeaturedPublicRepo } from "@/lib/public-index";

export const ALL_FEATURED_CATEGORIES = "Todas";

export interface FeaturedRepoFilterInput {
  query: string;
  category: string;
}

export const normalizeExploreQuery = (value: string): string => {
  return value.trim().toLowerCase();
};

const repoSearchText = (repo: FeaturedPublicRepo): string => {
  return [
    repo.fullName,
    repo.description,
    repo.category,
    repo.whyAudit,
    ...repo.tags,
  ].join(" ").toLowerCase();
};

export const filterFeaturedRepos = (
  repos: FeaturedPublicRepo[],
  filters: FeaturedRepoFilterInput,
): FeaturedPublicRepo[] => {
  const query = normalizeExploreQuery(filters.query);
  const category = filters.category.trim();

  return repos.filter((repo) => {
    const matchesCategory = !category || category === ALL_FEATURED_CATEGORIES || repo.category === category;
    const matchesQuery = !query || repoSearchText(repo).includes(query);

    return matchesCategory && matchesQuery;
  });
};
