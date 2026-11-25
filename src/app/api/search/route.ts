import type { NextRequest } from "next/server";
import { searchMulti } from "@/lib/tmdb/discover";

/**
 * GET /api/search?q=dune — powers the Ctrl+K palette.
 * Thin proxy so the TMDB token stays on the server; results are cached per query.
 */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json({ query: q, titles: [], people: [] });

  try {
    const { titles, people, totalResults } = await searchMulti(q);
    return Response.json(
      { query: q, titles: titles.slice(0, 8), people: people.slice(0, 4), totalResults },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch {
    return Response.json({ error: "Search is unavailable right now." }, { status: 502 });
  }
}
