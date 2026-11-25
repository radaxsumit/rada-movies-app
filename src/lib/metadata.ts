import type { Metadata } from "next";
import { titleHref } from "@/lib/routes";
import { backdropUrl, posterUrl } from "@/lib/tmdb/images";
import type { TitleDetail } from "@/lib/tmdb/types";

/** SEO + share-card metadata for a movie or show page. */
export function titleMetadata(t: TitleDetail): Metadata {
  const name = t.year ? `${t.title} (${t.year})` : t.title;
  const description =
    t.overview.length > 160
      ? `${t.overview.slice(0, 157).trimEnd()}…`
      : t.overview || `Reviews and where to watch ${t.title}.`;
  const image = backdropUrl(t.backdropPath, "w1280") ?? posterUrl(t.posterPath, "w780");
  const url = titleHref(t.mediaType, t.id, t.title);

  return {
    title: name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: name,
      description,
      url,
      type: t.mediaType === "movie" ? "video.movie" : "video.tv_show",
      images: [{ url: image, width: 1280, height: 720, alt: t.title }],
    },
    twitter: { card: "summary_large_image", title: name, description, images: [image] },
  };
}
