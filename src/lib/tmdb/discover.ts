import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { site } from "@/config/site";
import type { SortId } from "@/config/discovery";
import { toTitleCard } from "./client";
import { tmdbFetch } from "./fetch";
import type { MediaType, Paged, PersonCard, TitleCard, TitleListItem } from "./types";

export interface DiscoverFilters {
  sort?: SortId;
  genre?: number;
  provider?: number;
  keyword?: number;
  language?: string;
  /** Only titles made in this country (ISO 3166-1), e.g. "IN". */
  originCountry?: string;
  year?: number;
}

export interface TitlePage {
  results: TitleCard[];
  page: number;
  totalPages: number;
  totalResults: number;
}

/** TMDB caps discover/search at page 500. */
const MAX_PAGE = 500;

function sortParams(mediaType: MediaType, sort: SortId = "popular", today: string) {
  const dateField = mediaType === "movie" ? "primary_release_date" : "first_air_date";
  switch (sort) {
    case "top":
      return { sort_by: "vote_average.desc", "vote_count.gte": 300 };
    case "new":
      // Newest already released, ignoring obscure entries with no votes.
      return { sort_by: `${dateField}.desc`, [`${dateField}.lte`]: today, "vote_count.gte": 10 };
    default:
      return { sort_by: "popularity.desc" };
  }
}

/** Filtered browse. Cached per filter combination + page for an hour. */
export async function discover(mediaType: MediaType, filters: DiscoverFilters = {}, page = 1): Promise<TitlePage> {
  "use cache";
  cacheLife("hours");
  cacheTag("tmdb", `tmdb:discover:${mediaType}`);

  const today = new Date().toISOString().slice(0, 10);
  const yearField = mediaType === "movie" ? "primary_release_year" : "first_air_date_year";

  const data = await tmdbFetch<Paged<TitleListItem>>(`/discover/${mediaType}`, {
    language: "en-US",
    include_adult: "false",
    page: Math.min(Math.max(1, page), MAX_PAGE),
    ...sortParams(mediaType, filters.sort, today),
    with_genres: filters.genre,
    with_keywords: filters.keyword,
    with_original_language: filters.language,
    with_origin_country: filters.originCountry,
    [yearField]: filters.year,
    ...(filters.provider
      ? {
          with_watch_providers: filters.provider,
          watch_region: site.watchRegion,
          with_watch_monetization_types: "flatrate|free|ads",
        }
      : {}),
  });

  return {
    results: data.results.map((r) => toTitleCard(r, mediaType)),
    page: data.page,
    totalPages: Math.min(data.total_pages, MAX_PAGE),
    totalResults: data.total_results,
  };
}

export async function getGenres(mediaType: MediaType) {
  "use cache";
  cacheLife("weeks");
  cacheTag("tmdb", "tmdb:genres");

  const data = await tmdbFetch<{ genres: { id: number; name: string }[] }>(`/genre/${mediaType}/list`, {
    language: "en-US",
  });
  return data.genres;
}

export async function getKeywordName(id: number) {
  "use cache";
  cacheLife("weeks");

  const data = await tmdbFetch<{ id: number; name: string }>(`/keyword/${id}`).catch(() => null);
  return data?.name ?? null;
}

/** Top rated of all time (min. votes so obscure titles don't dominate). */
export async function getTopRated(mediaType: MediaType) {
  return (await discover(mediaType, { sort: "top" })).results;
}

/** Upcoming theatrical releases in our region. */
export async function getUpcomingMovies(): Promise<TitleCard[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("tmdb", "tmdb:upcoming");

  const data = await tmdbFetch<Paged<TitleListItem>>("/movie/upcoming", {
    language: "en-US",
    region: site.watchRegion,
  });
  return data.results.map((r) => toTitleCard(r, "movie"));
}

/* ───────────── Search ───────────── */

interface RawSearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  name?: string;
  title?: string;
  profile_path?: string | null;
  known_for_department?: string;
  known_for?: { title?: string; name?: string }[];
  popularity: number;
}

export interface SearchResults {
  query: string;
  titles: TitleCard[];
  people: PersonCard[];
  page: number;
  totalPages: number;
  totalResults: number;
}

/** Movies, shows and people in one query. Cached per query + page. */
export async function searchMulti(rawQuery: string, page = 1): Promise<SearchResults> {
  "use cache";
  cacheLife("hours");
  cacheTag("tmdb", "tmdb:search");

  const query = rawQuery.trim().slice(0, 100);
  if (!query) return { query, titles: [], people: [], page: 1, totalPages: 0, totalResults: 0 };

  const data = await tmdbFetch<Paged<RawSearchResult>>("/search/multi", {
    query,
    page: Math.min(Math.max(1, page), MAX_PAGE),
    language: "en-US",
    include_adult: "false",
  });

  const titles: TitleCard[] = [];
  const people: PersonCard[] = [];
  for (const r of data.results) {
    if (r.media_type === "person") {
      people.push({
        id: r.id,
        name: r.name ?? "",
        profilePath: r.profile_path ?? null,
        knownFor: [
          r.known_for_department,
          r.known_for
            ?.map((k) => k.title ?? k.name)
            .filter(Boolean)
            .slice(0, 2)
            .join(", "),
        ]
          .filter(Boolean)
          .join(" · "),
      });
    } else if (r.media_type === "movie" || r.media_type === "tv") {
      titles.push(toTitleCard(r as unknown as TitleListItem));
    }
  }

  return { query, titles, people, page: data.page, totalPages: data.total_pages, totalResults: data.total_results };
}
