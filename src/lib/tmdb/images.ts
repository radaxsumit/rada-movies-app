/** Safe to import from client components: builds public TMDB image URLs only. */

const IMAGE_BASE = "https://image.tmdb.org/t/p";

type PosterSize = "w185" | "w342" | "w500" | "w780" | "original";
type BackdropSize = "w780" | "w1280" | "original";

export const NO_POSTER = "/images/no-poster.png";

export function posterUrl(path: string | null | undefined, size: PosterSize = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : NO_POSTER;
}

export function backdropUrl(path: string | null | undefined, size: BackdropSize = "w1280") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function profileUrl(path: string | null | undefined, size: "w185" | "h632" | "original" = "w185") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function logoUrl(path: string | null | undefined, size: "w300" | "w500" | "original" = "w500") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function stillUrl(path: string | null | undefined, size: "w300" | "original" = "w300") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function providerLogoUrl(path: string) {
  return `${IMAGE_BASE}/w92${path}`;
}
