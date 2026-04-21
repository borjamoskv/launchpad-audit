import type { MetadataRoute } from "next";
import { getAppOrigin } from "@/lib/public-report";

export default function robots(): MetadataRoute.Robots {
  const origin = getAppOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/_next/"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
