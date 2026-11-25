/** Subset of TMDB v3 response shapes we use. Extend as features need more fields. */

export type MediaType = "movie" | "tv";

export interface Paged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface BaseItem {
  id: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids?: number[];
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
}

export interface MovieListItem extends BaseItem {
  media_type?: "movie";
  title: string;
  original_title: string;
  release_date?: string;
}

export interface TvListItem extends BaseItem {
  media_type?: "tv";
  name: string;
  original_name: string;
  first_air_date?: string;
}

export type TitleListItem = MovieListItem | TvListItem;

/** Normalised card shape the UI consumes, whatever TMDB returned. */
export interface TitleCard {
  id: number;
  mediaType: MediaType;
  title: string;
  year: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number | null;
  overview: string;
}

/* ───────────── Normalised detail models (what pages consume) ───────────── */

export interface PersonCredit {
  id: number;
  name: string;
  role: string;
  profilePath: string | null;
}

export interface Trailer {
  key: string;
  name: string;
}

export interface Provider {
  id: number;
  name: string;
  logoPath: string;
}

export interface WatchProviders {
  /** TMDB/JustWatch page listing all offers for this title in the region. */
  link: string | null;
  stream: Provider[];
  free: Provider[];
  rent: Provider[];
  buy: Provider[];
}

export interface SeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airYear: string | null;
  posterPath: string | null;
  overview: string;
}

export interface TitleDetail {
  id: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  tagline: string | null;
  overview: string;
  year: string | null;
  releaseDate: string | null;
  runtimeMinutes: number | null;
  certification: string | null;
  genres: { id: number; name: string }[];
  rating: number | null;
  voteCount: number;
  posterPath: string | null;
  backdropPath: string | null;
  logoPath: string | null;
  trailer: Trailer | null;
  cast: PersonCredit[];
  /** Directors for movies, creators for shows. */
  leads: PersonCredit[];
  writers: PersonCredit[];
  keywords: { id: number; name: string }[];
  recommendations: TitleCard[];
  providers: WatchProviders | null;
  status: string | null;
  originalLanguage: string;
  spokenLanguages: string[];
  countries: string[];
  budget: number | null;
  revenue: number | null;
  /** TV only */
  networks: Provider[];
  seasons: SeasonSummary[];
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
}

export interface Episode {
  id: number;
  episodeNumber: number;
  name: string;
  overview: string;
  airDate: string | null;
  runtimeMinutes: number | null;
  stillPath: string | null;
  rating: number | null;
}

export interface SeasonDetail {
  showId: number;
  seasonNumber: number;
  name: string;
  overview: string;
  airYear: string | null;
  posterPath: string | null;
  episodes: Episode[];
}

export interface FilmographyItem extends TitleCard {
  role: string;
  /** "Acting" or the crew department. */
  department: string;
  date: string | null;
}

export interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  knownForDepartment: string | null;
  birthday: string | null;
  deathday: string | null;
  placeOfBirth: string | null;
  profilePath: string | null;
  alsoKnownAs: string[];
  imdbId: string | null;
  instagramId: string | null;
  knownFor: TitleCard[];
  filmography: FilmographyItem[];
}

export interface PersonCard {
  id: number;
  name: string;
  profilePath: string | null;
  /** e.g. "Acting · Drive, La La Land" */
  knownFor: string;
}
