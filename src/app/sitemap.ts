import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { titleHref } from "@/lib/routes";
import { getRecentLists } from "@/lib/social";
import { getPopular, getTrending } from "@/lib/tmdb/client";
import { getTopRated } from "@/lib/tmdb/discover";

/**
 * Key pages plus currently popular / top-rated titles and recent public lists.
 * Every other title page is still discoverable through internal links.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [trending, popularMovies, popularTv, topMovies, topTv, lists] = await Promise.all([
    getTrending("week"),
    getPopular("movie"),
    getPopular("tv"),
    getTopRated("movie"),
    getTopRated("tv"),
    getRecentLists().catch(() => []),
  ]);

  const abs = (path: string) => `${site.url}${path}`;
  const seen = new Set<string>();
  const titles = [...trending, ...popularMovies, ...popularTv, ...topMovies, ...topTv].filter((t) => {
    const key = `${t.mediaType}-${t.id}`;
    return seen.has(key) ? false : (seen.add(key), true);
  });

  return [
    { url: abs("/"), changeFrequency: "daily", priority: 1 },
    { url: abs("/movies"), changeFrequency: "daily", priority: 0.8 },
    { url: abs("/tv"), changeFrequency: "daily", priority: 0.8 },
    { url: abs("/lists"), changeFrequency: "daily", priority: 0.6 },
    { url: abs("/about"), changeFrequency: "yearly", priority: 0.3 },
    ...titles.map((t) => ({
      url: abs(titleHref(t.mediaType, t.id, t.title)),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...lists.map((l) => ({ url: abs(`/lists/${l.id}`), changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}
