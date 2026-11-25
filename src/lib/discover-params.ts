/**
 * URL <-> filter conversion for browse pages. Client- and server-safe.
 * URL keys: sort, genre, provider, keyword, lang, origin, year
 */
import { languageOptions, sortOptions, type SortId } from "@/config/discovery";
import type { DiscoverFilters } from "@/lib/tmdb/discover";

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function get(params: RawParams, key: string) {
  const v = params instanceof URLSearchParams ? params.get(key) : params[key];
  return (Array.isArray(v) ? v[0] : v) ?? undefined;
}

const positiveInt = (v?: string) => {
  const n = v && /^\d{1,9}$/.test(v) ? Number(v) : NaN;
  return n > 0 ? n : undefined;
};

/** Parse and validate filters; unknown or malformed values are dropped, never passed to TMDB. */
export function parseFilters(params: RawParams): DiscoverFilters {
  const sort = get(params, "sort");
  const lang = get(params, "lang");
  const origin = get(params, "origin")?.toUpperCase();
  const year = positiveInt(get(params, "year"));
  return {
    sort: sortOptions.some((s) => s.id === sort) ? (sort as SortId) : undefined,
    genre: positiveInt(get(params, "genre")),
    provider: positiveInt(get(params, "provider")),
    keyword: positiveInt(get(params, "keyword")),
    language: languageOptions.some((l) => l.code === lang) ? lang : undefined,
    originCountry: origin && /^[A-Z]{2}$/.test(origin) ? origin : undefined,
    year: year && year >= 1900 && year <= 2100 ? year : undefined,
  };
}

export function filtersToSearchParams(f: DiscoverFilters) {
  const sp = new URLSearchParams();
  if (f.sort && f.sort !== "popular") sp.set("sort", f.sort);
  if (f.genre) sp.set("genre", String(f.genre));
  if (f.provider) sp.set("provider", String(f.provider));
  if (f.keyword) sp.set("keyword", String(f.keyword));
  if (f.language) sp.set("lang", f.language);
  if (f.originCountry) sp.set("origin", f.originCountry);
  if (f.year) sp.set("year", String(f.year));
  return sp;
}

export function parsePage(params: RawParams) {
  return Math.min(500, positiveInt(get(params, "page")) ?? 1);
}
