import type { NextRequest } from "next/server";
import { parseFilters, parsePage } from "@/lib/discover-params";
import { rateLimit } from "@/lib/ip-rate-limit";
import { discover } from "@/lib/tmdb/discover";

/** GET /api/discover?type=movie&page=2&genre=28… — next pages for the browse grid's infinite scroll. */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "discover", 60);
  if (limited) return limited;
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  if (type !== "movie" && type !== "tv") {
    return Response.json({ error: "type must be movie or tv" }, { status: 400 });
  }

  try {
    const data = await discover(type, parseFilters(params), parsePage(params));
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return Response.json({ error: "Couldn’t load more titles." }, { status: 502 });
  }
}
