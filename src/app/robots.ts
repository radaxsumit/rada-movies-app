import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or per-user pages: nothing useful for search engines.
      disallow: ["/api/", "/auth/", "/settings/", "/welcome", "/watchlist", "/feed", "/admin/", "/search", "/sign-in"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
