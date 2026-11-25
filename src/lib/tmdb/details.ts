import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { site } from "@/config/site";
import { toTitleCard } from "./client";
import { tmdbFetchOrNull } from "./fetch";
import type {
  FilmographyItem,
  Paged,
  PersonCredit,
  PersonDetail,
  Provider,
  SeasonDetail,
  TitleDetail,
  TitleListItem,
  Trailer,
  WatchProviders,
} from "./types";

/* ───────────── Raw TMDB shapes (only the fields we read) ───────────── */

interface RawPerson {
  id: number;
  name: string;
  profile_path: string | null;
  character?: string;
  job?: string;
  department?: string;
  order?: number;
  roles?: { character: string; episode_count: number }[];
  jobs?: { job: string }[];
  total_episode_count?: number;
}

interface RawVideo {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  iso_639_1: string;
  published_at?: string;
}

interface RawProviderEntry {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

interface RawRegionProviders {
  link?: string;
  flatrate?: RawProviderEntry[];
  free?: RawProviderEntry[];
  ads?: RawProviderEntry[];
  rent?: RawProviderEntry[];
  buy?: RawProviderEntry[];
}

interface RawCommon {
  id: number;
  overview: string;
  tagline?: string;
  genres: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
  backdrop_path: string | null;
  status?: string;
  original_language: string;
  spoken_languages?: { english_name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  videos?: { results: RawVideo[] };
  images?: { logos: { file_path: string; iso_639_1: string | null; vote_average: number }[] };
  keywords?: { keywords?: { id: number; name: string }[]; results?: { id: number; name: string }[] };
  recommendations?: Paged<TitleListItem>;
  "watch/providers"?: { results: Record<string, RawRegionProviders> };
}

interface RawMovie extends RawCommon {
  title: string;
  original_title: string;
  release_date?: string;
  runtime?: number | null;
  budget?: number;
  revenue?: number;
  credits?: { cast: RawPerson[]; crew: RawPerson[] };
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[] };
}

interface RawTv extends RawCommon {
  name: string;
  original_name: string;
  first_air_date?: string;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  created_by?: RawPerson[];
  networks?: { id: number; name: string; logo_path: string | null }[];
  seasons?: {
    season_number: number;
    name: string;
    episode_count: number;
    air_date: string | null;
    poster_path: string | null;
    overview: string;
  }[];
  aggregate_credits?: { cast: RawPerson[]; crew: RawPerson[] };
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
}

/* ───────────── Normalisers ───────────── */

const rating = (avg: number, count: number) => (count > 0 ? Math.round(avg * 10) / 10 : null);
const yearOf = (date?: string | null) => (date ? date.slice(0, 4) : null);

function pickTrailer(videos: RawVideo[] = []): Trailer | null {
  const youtube = videos.filter((v) => v.site === "YouTube");
  const score = (v: RawVideo) =>
    (v.type === "Trailer" ? 4 : v.type === "Teaser" ? 2 : 0) + (v.official ? 1 : 0) + (v.iso_639_1 === "en" ? 1 : 0);
  const best = youtube.sort((a, b) => score(b) - score(a))[0];
  return best && score(best) >= 2 ? { key: best.key, name: best.name } : null;
}

function pickLogo(images: RawCommon["images"]): string | null {
  const logos = images?.logos ?? [];
  const best = logos.find((l) => l.iso_639_1 === "en") ?? logos.find((l) => l.iso_639_1 === null);
  return best?.file_path ?? null;
}

function providers(raw: RawCommon["watch/providers"], region: string): WatchProviders | null {
  const r = raw?.results?.[region];
  if (!r) return null;
  const map = (list: RawProviderEntry[] = []): Provider[] =>
    [...list]
      .sort((a, b) => a.display_priority - b.display_priority)
      .map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path }));
  return {
    link: r.link ?? null,
    stream: map(r.flatrate),
    free: map([...(r.free ?? []), ...(r.ads ?? [])]),
    rent: map(r.rent),
    buy: map(r.buy),
  };
}

const toCredit = (p: RawPerson, role: string): PersonCredit => ({
  id: p.id,
  name: p.name,
  role,
  profilePath: p.profile_path,
});

function uniqueById<T extends { id: number }>(items: T[]) {
  const seen = new Set<number>();
  return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
}

/* ───────────── Fetchers ───────────── */

const IMAGE_LANGS = "en,null";

/** Full movie page data in one request. Cached for a day. */
export async function getMovie(id: number): Promise<TitleDetail | null> {
  "use cache";
  cacheLife("days");
  cacheTag("tmdb", `tmdb:movie:${id}`);

  const m = await tmdbFetchOrNull<RawMovie>(`/movie/${id}`, {
    language: "en-US",
    append_to_response: "credits,videos,images,release_dates,keywords,recommendations,watch/providers",
    include_image_language: IMAGE_LANGS,
  });
  if (!m) return null;

  const certFor = (country: string) =>
    m.release_dates?.results.find((r) => r.iso_3166_1 === country)?.release_dates.find((d) => d.certification)
      ?.certification ?? null;

  const crew = m.credits?.crew ?? [];
  return {
    id: m.id,
    mediaType: "movie",
    title: m.title,
    originalTitle: m.original_title,
    tagline: m.tagline || null,
    overview: m.overview,
    year: yearOf(m.release_date),
    releaseDate: m.release_date || null,
    runtimeMinutes: m.runtime || null,
    certification: certFor(site.watchRegion) ?? certFor("US"),
    genres: m.genres,
    rating: rating(m.vote_average, m.vote_count),
    voteCount: m.vote_count,
    posterPath: m.poster_path,
    backdropPath: m.backdrop_path,
    logoPath: pickLogo(m.images),
    trailer: pickTrailer(m.videos?.results),
    cast: (m.credits?.cast ?? []).slice(0, 20).map((p) => toCredit(p, p.character ?? "")),
    leads: uniqueById(crew.filter((p) => p.job === "Director").map((p) => toCredit(p, "Director"))),
    writers: uniqueById(
      crew.filter((p) => p.department === "Writing").map((p) => toCredit(p, p.job ?? "Writer")),
    ).slice(0, 4),
    keywords: (m.keywords?.keywords ?? []).slice(0, 10),
    recommendations: (m.recommendations?.results ?? []).slice(0, 18).map((r) => toTitleCard(r, "movie")),
    providers: providers(m["watch/providers"], site.watchRegion),
    status: m.status ?? null,
    originalLanguage: m.original_language,
    spokenLanguages: (m.spoken_languages ?? []).map((l) => l.english_name),
    countries: (m.production_countries ?? []).map((c) => c.name),
    budget: m.budget || null,
    revenue: m.revenue || null,
    networks: [],
    seasons: [],
    numberOfSeasons: null,
    numberOfEpisodes: null,
  };
}

/** Full show page data in one request. Cached for a day. */
export async function getTv(id: number): Promise<TitleDetail | null> {
  "use cache";
  cacheLife("days");
  cacheTag("tmdb", `tmdb:tv:${id}`);

  const t = await tmdbFetchOrNull<RawTv>(`/tv/${id}`, {
    language: "en-US",
    append_to_response: "aggregate_credits,videos,images,content_ratings,keywords,recommendations,watch/providers",
    include_image_language: IMAGE_LANGS,
  });
  if (!t) return null;

  const certFor = (country: string) =>
    t.content_ratings?.results.find((r) => r.iso_3166_1 === country && r.rating)?.rating ?? null;

  const crew = t.aggregate_credits?.crew ?? [];
  return {
    id: t.id,
    mediaType: "tv",
    title: t.name,
    originalTitle: t.original_name,
    tagline: t.tagline || null,
    overview: t.overview,
    year: yearOf(t.first_air_date),
    releaseDate: t.first_air_date || null,
    runtimeMinutes: t.episode_run_time?.[0] ?? null,
    certification: certFor(site.watchRegion) ?? certFor("US"),
    genres: t.genres,
    rating: rating(t.vote_average, t.vote_count),
    voteCount: t.vote_count,
    posterPath: t.poster_path,
    backdropPath: t.backdrop_path,
    logoPath: pickLogo(t.images),
    trailer: pickTrailer(t.videos?.results),
    cast: (t.aggregate_credits?.cast ?? []).slice(0, 20).map((p) => toCredit(p, p.roles?.[0]?.character ?? "")),
    leads: (t.created_by ?? []).map((p) => toCredit(p, "Creator")),
    writers: uniqueById(
      crew.filter((p) => p.department === "Writing").map((p) => toCredit(p, p.jobs?.[0]?.job ?? "Writer")),
    ).slice(0, 4),
    keywords: (t.keywords?.results ?? []).slice(0, 10),
    recommendations: (t.recommendations?.results ?? []).slice(0, 18).map((r) => toTitleCard(r, "tv")),
    providers: providers(t["watch/providers"], site.watchRegion),
    status: t.status ?? null,
    originalLanguage: t.original_language,
    spokenLanguages: (t.spoken_languages ?? []).map((l) => l.english_name),
    countries: (t.production_countries ?? []).map((c) => c.name),
    budget: null,
    revenue: null,
    networks: (t.networks ?? [])
      .filter((n) => n.logo_path)
      .map((n) => ({ id: n.id, name: n.name, logoPath: n.logo_path! })),
    seasons: (t.seasons ?? [])
      .filter((s) => s.episode_count > 0)
      // Specials (season 0) go last.
      .sort((a, b) => (a.season_number || 999) - (b.season_number || 999))
      .map((s) => ({
        seasonNumber: s.season_number,
        name: s.name,
        episodeCount: s.episode_count,
        airYear: yearOf(s.air_date),
        posterPath: s.poster_path,
        overview: s.overview,
      })),
    numberOfSeasons: t.number_of_seasons ?? null,
    numberOfEpisodes: t.number_of_episodes ?? null,
  };
}

interface RawSeason {
  name: string;
  overview: string;
  air_date: string | null;
  poster_path: string | null;
  season_number: number;
  episodes: {
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    air_date: string | null;
    runtime: number | null;
    still_path: string | null;
    vote_average: number;
    vote_count: number;
  }[];
}

export async function getTvSeason(showId: number, seasonNumber: number): Promise<SeasonDetail | null> {
  "use cache";
  cacheLife("days");
  cacheTag("tmdb", `tmdb:tv:${showId}`);

  const s = await tmdbFetchOrNull<RawSeason>(`/tv/${showId}/season/${seasonNumber}`, { language: "en-US" });
  if (!s) return null;
  return {
    showId,
    seasonNumber: s.season_number,
    name: s.name,
    overview: s.overview,
    airYear: yearOf(s.air_date),
    posterPath: s.poster_path,
    episodes: s.episodes.map((e) => ({
      id: e.id,
      episodeNumber: e.episode_number,
      name: e.name,
      overview: e.overview,
      airDate: e.air_date,
      runtimeMinutes: e.runtime,
      stillPath: e.still_path,
      rating: rating(e.vote_average, e.vote_count),
    })),
  };
}

interface RawPersonDetail {
  id: number;
  name: string;
  biography: string;
  known_for_department: string | null;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  also_known_as: string[];
  external_ids?: { imdb_id: string | null; instagram_id: string | null };
  combined_credits?: {
    cast: (TitleListItem & { media_type: "movie" | "tv"; character?: string; episode_count?: number })[];
    crew: (TitleListItem & { media_type: "movie" | "tv"; job?: string; department?: string })[];
  };
}

export async function getPerson(id: number): Promise<PersonDetail | null> {
  "use cache";
  cacheLife("days");
  cacheTag("tmdb", `tmdb:person:${id}`);

  const p = await tmdbFetchOrNull<RawPersonDetail>(`/person/${id}`, {
    language: "en-US",
    append_to_response: "combined_credits,external_ids",
  });
  if (!p) return null;

  const cast = p.combined_credits?.cast ?? [];
  const crew = p.combined_credits?.crew ?? [];
  const dateOf = (i: TitleListItem) => ("title" in i ? i.release_date : i.first_air_date) || null;

  const filmography: FilmographyItem[] = [
    ...cast
      // Talk shows and award shows list hundreds of one-off "Self" credits; skip them.
      .filter((c) => !(c.media_type === "tv" && /\b(self|himself|herself)\b/i.test(c.character ?? "")))
      .map((c) => ({ ...toTitleCard(c), role: c.character ?? "", department: "Acting", date: dateOf(c) })),
    ...crew.map((c) => ({ ...toTitleCard(c), role: c.job ?? "", department: c.department ?? "Crew", date: dateOf(c) })),
  ].sort((a, b) => (b.date ?? "9999").localeCompare(a.date ?? "9999"));

  // "Known for": most-voted credits in their main department.
  const main = p.known_for_department === "Acting" ? cast : crew;
  const knownFor = uniqueById(
    [...main]
      .filter(
        (c) =>
          c.poster_path &&
          !(c.media_type === "tv" && /\b(self)\b/i.test((c as { character?: string }).character ?? "")),
      )
      .sort((a, b) => b.vote_count - a.vote_count)
      .map((c) => toTitleCard(c)),
  ).slice(0, 12);

  return {
    id: p.id,
    name: p.name,
    biography: p.biography,
    knownForDepartment: p.known_for_department,
    birthday: p.birthday,
    deathday: p.deathday,
    placeOfBirth: p.place_of_birth,
    profilePath: p.profile_path,
    alsoKnownAs: p.also_known_as,
    imdbId: p.external_ids?.imdb_id ?? null,
    instagramId: p.external_ids?.instagram_id ?? null,
    knownFor,
    filmography,
  };
}
