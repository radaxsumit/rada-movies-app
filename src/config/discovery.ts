/**
 * Curated discovery data. IDs are TMDB's and are stable.
 * Streaming IDs come from /watch/providers/movie?watch_region=IN.
 */

export const streamingServices = [
  { id: 8, name: "Netflix", slug: "netflix" },
  { id: 119, name: "Prime Video", slug: "prime-video" },
  { id: 2336, name: "JioHotstar", slug: "jiohotstar" },
  { id: 237, name: "Sony LIV", slug: "sony-liv" },
  { id: 232, name: "ZEE5", slug: "zee5" },
  { id: 350, name: "Apple TV+", slug: "apple-tv" },
  { id: 283, name: "Crunchyroll", slug: "crunchyroll" },
  { id: 11, name: "MUBI", slug: "mubi" },
] as const;

/** Mood shortcuts on the landing page. Each maps to a TMDB keyword (checked to have 100+ movies). */
export const moods = [
  { label: "Mind games", emoji: "🌀", keywordId: 12565 },
  { label: "Feel-good", emoji: "☀️", keywordId: 275276 },
  { label: "Heists", emoji: "💰", keywordId: 10051 },
  { label: "Time travel", emoji: "⏳", keywordId: 4379 },
  { label: "True stories", emoji: "📰", keywordId: 9672 },
  { label: "Dystopias", emoji: "🏙️", keywordId: 4565 },
  { label: "Coming of age", emoji: "🎒", keywordId: 10683 },
  { label: "Revenge", emoji: "🗡️", keywordId: 9748 },
] as const;

export const sortOptions = [
  { id: "popular", label: "Popular" },
  { id: "top", label: "Top rated" },
  { id: "new", label: "Newest" },
] as const;

export type SortId = (typeof sortOptions)[number]["id"];

export const languageOptions = [
  { code: "hi", label: "Hindi" },
  { code: "en", label: "English" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
] as const;
