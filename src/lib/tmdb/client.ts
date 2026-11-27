import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { tmdbFetch } from "./fetch";
import type { MediaType, Paged, TitleCard, TitleListItem } from "./types";

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")}…` : text;
}

export function toTitleCard(item: TitleListItem, fallbackType?: MediaType): TitleCard {
  const isTv = item.media_type === "tv" || (!item.media_type && fallbackType === "tv") || "name" in item;
  const date = isTv
    ? (item as { first_air_date?: string }).first_air_date
    : (item as { release_date?: string }).release_date;
  return {
    id: item.id,
    mediaType: isTv ? "tv" : "movie",
    title: "title" in item ? item.title : item.name,
    year: date ? date.slice(0, 4) : null,
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    rating: item.vote_count > 0 ? Math.round(item.vote_average * 10) / 10 : null,
    // Cards only show a 4-line preview; full text would double the page data on long rows.
    overview: clip(item.overview, 220),
  };
}

/** Trending movies + shows. Refreshed hourly. */
export async function getTrending(window: "day" | "week" = "day"): Promise<TitleCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("tmdb", "tmdb:trending");

  // Trending "all" also returns people; keep only movies and shows.
  const data = await tmdbFetch<Paged<TitleListItem | { media_type: "person"; id: number }>>(`/trending/all/${window}`, {
    language: "en-US",
  });
  return data.results
    .filter((item): item is TitleListItem => item.media_type !== "person")
    .map((item) => toTitleCard(item));
}

/** Popular titles of one type, optionally filtered to a streaming provider in our region. */
export async function getPopular(mediaType: MediaType, opts: { providerId?: number; region?: string } = {}) {
  "use cache";
  cacheLife("hours");
  cacheTag("tmdb", `tmdb:popular:${mediaType}`);

  const data = await tmdbFetch<Paged<TitleListItem>>(`/discover/${mediaType}`, {
    sort_by: "popularity.desc",
    include_adult: "false",
    language: "en-US",
    watch_region: opts.providerId ? (opts.region ?? "IN") : undefined,
    with_watch_providers: opts.providerId,
  });
  return data.results.map((item) => toTitleCard(item, mediaType));
}
