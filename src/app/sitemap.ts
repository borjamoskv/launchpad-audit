import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/public-report";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getAppOrigin();
  const lastModified = new Date();

  return [
    {
      url: origin,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${origin}/r/borjamoskv/launchpad-audit`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
