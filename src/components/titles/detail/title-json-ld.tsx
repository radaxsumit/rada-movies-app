import { site } from "@/config/site";
import { personHref, titleHref } from "@/lib/routes";
import { posterUrl } from "@/lib/tmdb/images";
import type { TitleDetail } from "@/lib/tmdb/types";

/**
 * schema.org Movie / TVSeries data so search engines can show rich results.
 * Only facts from TMDB; no ratings, since we don't publish an aggregate score of our own yet.
 */
export function TitleJsonLd({ title }: { title: TitleDetail }) {
  const data = {
    "@context": "https://schema.org",
    "@type": title.mediaType === "tv" ? "TVSeries" : "Movie",
    name: title.title,
    url: `${site.url}${titleHref(title.mediaType, title.id, title.title)}`,
    image: title.posterPath ? posterUrl(title.posterPath, "w780") : undefined,
    description: title.overview || undefined,
    datePublished: title.releaseDate ?? undefined,
    genre: title.genres.map((g) => g.name),
    inLanguage: title.originalLanguage,
    [title.mediaType === "tv" ? "creator" : "director"]: title.leads.map((p) => ({
      "@type": "Person",
      name: p.name,
      url: `${site.url}${personHref(p.id, p.name)}`,
    })),
    actor: title.cast.slice(0, 10).map((p) => ({ "@type": "Person", name: p.name })),
    duration: title.mediaType === "movie" && title.runtimeMinutes ? `PT${title.runtimeMinutes}M` : undefined,
    numberOfSeasons: title.numberOfSeasons ?? undefined,
  };
  // Escape "<" so a title like "</script>" can't break out of the tag.
  const json = JSON.stringify(data).replace(/</g, "\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
