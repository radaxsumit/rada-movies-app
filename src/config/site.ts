/**
 * Brand + navigation in one place, so a rename touches only this file.
 * The name is a placeholder until the brand is decided.
 */
export const site = {
  name: "RADA Movies",
  shortName: "RADA",
  tagline: "Find what to watch. Say what you thought.",
  description: "Discover movies and shows, see where to stream them, and share honest one-word verdicts with friends.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Default region for "where to watch" data (ISO 3166-1). */
  watchRegion: "IN",
  nav: [
    { label: "Home", href: "/" },
    { label: "Movies", href: "/movies" },
    { label: "Shows", href: "/tv" },
    { label: "Lists", href: "/lists" },
  ],
} as const;

export type Site = typeof site;
