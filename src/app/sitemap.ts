import type { MetadataRoute } from "next";
import { EXPLORE_PATH, getFeaturedPublicRepoPaths } from "@/lib/public-index";
import { getAppOrigin } from "@/lib/public-report";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getAppOrigin();
  const lastModified = new Date();
  const featuredRepoEntries = getFeaturedPublicRepoPaths().map((path) => ({
    url: `${origin}${path}`,
    lastModified,
    changeFrequency: "daily" as const,
    priority: 0.86,
  }));

  return [
    {
      url: origin,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${origin}${EXPLORE_PATH}`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...featuredRepoEntries,
  ];
}
