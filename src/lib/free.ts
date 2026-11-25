import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { watchHref } from "@/lib/routes";
import { publicClient } from "@/lib/supabase/public";
import { getMovie, getTv } from "@/lib/tmdb/details";
import type { MediaType, TitleCard, TitleDetail } from "@/lib/tmdb/types";

/**
 * "Watch free": films we can legally stream in full, from the curated `free_titles` table
 * (public domain on Internet Archive, or official uploads). Users can't write to that table.
 */

export type FreeSource = "archive" | "youtube";

export interface FreeOffer {
  id: string;
  mediaType: MediaType;
  tmdbId: number;
  source: FreeSource;
  sourceId: string;
  license: string;
  licenseUrl: string | null;
  featured: boolean;
}

export interface FreeTitle extends FreeOffer {
  detail: TitleDetail;
  href: string;
}

const TAG = "free-titles";

type Row = {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  source: string;
  source_id: string;
  license: string;
  license_url: string | null;
  featured: boolean;
};

const toOffer = (r: Row): FreeOffer => ({
  id: r.id,
  mediaType: r.media_type,
  tmdbId: r.tmdb_id,
  source: r.source === "youtube" ? "youtube" : "archive",
  sourceId: r.source_id,
  license: r.license,
  licenseUrl: r.license_url,
  featured: r.featured,
});

const COLUMNS = "id, tmdb_id, media_type, source, source_id, license, license_url, featured";

async function withDetail(offer: FreeOffer): Promise<FreeTitle | null> {
  const detail = offer.mediaType === "tv" ? await getTv(offer.tmdbId) : await getMovie(offer.tmdbId);
  return detail ? { ...offer, detail, href: watchHref(offer.mediaType, offer.tmdbId, detail.title) } : null;
}

/** Whole catalogue, featured first. Cached for an hour; adding a title shows up within that. */
export async function getFreeCatalogue(): Promise<FreeTitle[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG);

  const { data, error } = await publicClient()
    .from("free_titles")
    .select(COLUMNS)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(500);
  if (error) throw new Error(`Failed to load free titles: ${error.message}`);

  const titles = await Promise.all((data as Row[]).map((r) => withDetail(toOffer(r)).catch(() => null)));
  return titles.filter((t): t is FreeTitle => t !== null);
}

/** Is this title free to watch here? Used for the "Watch free" button on title pages. */
export async function getFreeOffer(mediaType: MediaType, tmdbId: number): Promise<FreeOffer | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAG);

  const { data } = await publicClient()
    .from("free_titles")
    .select(COLUMNS)
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId)
    .order("featured", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? toOffer(data as Row) : null;
}

export async function getFreeTitle(mediaType: MediaType, tmdbId: number): Promise<FreeTitle | null> {
  const offer = await getFreeOffer(mediaType, tmdbId);
  return offer ? withDetail(offer) : null;
}

/** Card for rows/grids, linking straight to the player with a FREE badge. */
export function toFreeCard(t: FreeTitle): TitleCard {
  return {
    id: t.detail.id,
    mediaType: t.detail.mediaType,
    title: t.detail.title,
    year: t.detail.year,
    posterPath: t.detail.posterPath,
    backdropPath: t.detail.backdropPath,
    rating: t.detail.rating,
    overview: t.detail.overview,
    href: t.href,
    badge: "Free",
  };
}

/**
 * Player URL for a source. Both are the providers' official embeds:
 * archive.org/embed for Internet Archive, youtube-nocookie for YouTube.
 */
export function embedUrl(source: FreeSource, sourceId: string) {
  const id = encodeURIComponent(sourceId);
  return source === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`
    : `https://archive.org/embed/${id}`;
}

export function sourceLabel(source: FreeSource) {
  return source === "youtube" ? "YouTube (official upload)" : "Internet Archive";
}

export function sourcePageUrl(source: FreeSource, sourceId: string) {
  const id = encodeURIComponent(sourceId);
  return source === "youtube" ? `https://www.youtube.com/watch?v=${id}` : `https://archive.org/details/${id}`;
}
