import "server-only";
import { getMovie, getTv } from "./details";
import type { MediaType, TitleCard } from "./types";

/** Resolve a (type, id) pair stored in our DB into a card. Uses the day-cached detail fetchers. */
export async function getTitleCard(mediaType: MediaType, tmdbId: number): Promise<TitleCard | null> {
  const d = mediaType === "tv" ? await getTv(tmdbId) : await getMovie(tmdbId);
  if (!d) return null;
  return {
    id: d.id,
    mediaType: d.mediaType,
    title: d.title,
    year: d.year,
    posterPath: d.posterPath,
    backdropPath: d.backdropPath,
    rating: d.rating,
    overview: d.overview,
  };
}

/** Many at once, keeping order and dropping titles TMDB no longer has. */
export async function getTitleCards(items: { mediaType: MediaType; tmdbId: number }[]) {
  const cards = await Promise.all(items.map((i) => getTitleCard(i.mediaType, i.tmdbId).catch(() => null)));
  return cards.filter((c): c is TitleCard => c !== null);
}
