/** URL builders + parsers. Safe for client and server. URLs look like /movie/550-fight-club. */

import type { MediaType } from "@/lib/tmdb/types";

export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function withSlug(id: number, name?: string) {
  const slug = name ? slugify(name) : "";
  return slug ? `${id}-${slug}` : String(id);
}

export function titleHref(mediaType: MediaType, id: number, title?: string) {
  return `/${mediaType}/${withSlug(id, title)}`;
}

export function seasonHref(showId: number, showTitle: string, seasonNumber: number) {
  return `${titleHref("tv", showId, showTitle)}/season/${seasonNumber}`;
}

/** Free player: /watch/653-nosferatu for movies, /watch/tv-1234-name for shows. */
export function watchHref(mediaType: MediaType, id: number, title?: string) {
  return `/watch/${mediaType === "tv" ? "tv-" : ""}${withSlug(id, title)}`;
}

export function parseWatchParam(param: string): { mediaType: MediaType; id: number } | null {
  const isTv = param.startsWith("tv-");
  const id = parseIdParam(isTv ? param.slice(3) : param);
  return id ? { mediaType: isTv ? "tv" : "movie", id } : null;
}

export function personHref(id: number, name?: string) {
  return `/person/${withSlug(id, name)}`;
}

/** "550-fight-club" → 550. Returns null for anything that isn't a positive id. */
export function parseIdParam(param: string): number | null {
  const match = /^(\d{1,10})(?:-|$)/.exec(param);
  const id = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
