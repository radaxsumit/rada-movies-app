import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getTrending } from "./client";
import { getMovie, getTv } from "./details";
import type { TitleDetail } from "./types";

export type HeroSlide = Pick<
  TitleDetail,
  | "id"
  | "mediaType"
  | "title"
  | "overview"
  | "year"
  | "genres"
  | "rating"
  | "backdropPath"
  | "logoPath"
  | "trailer"
  | "certification"
>;

/** Today's top trending titles with backdrop, logo art and trailer, for the landing hero. */
export async function getHeroSlides(count = 6): Promise<HeroSlide[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("tmdb", "tmdb:trending");

  const trending = (await getTrending("day")).filter((t) => t.backdropPath && t.overview).slice(0, count);
  const details = await Promise.all(trending.map((t) => (t.mediaType === "tv" ? getTv(t.id) : getMovie(t.id))));

  return details
    .filter((d): d is TitleDetail => d !== null)
    .map((d) => ({
      id: d.id,
      mediaType: d.mediaType,
      title: d.title,
      overview: d.overview,
      year: d.year,
      genres: d.genres.slice(0, 3),
      rating: d.rating,
      backdropPath: d.backdropPath,
      logoPath: d.logoPath,
      trailer: d.trailer,
      certification: d.certification,
    }));
}
