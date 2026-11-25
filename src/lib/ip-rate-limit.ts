import "server-only";
import type { NextRequest } from "next/server";

/**
 * Best-effort per-IP limiter for public API routes, so a script can't burn through our TMDB quota.
 * In-memory, so each server instance counts separately — pair it with a platform rule
 * (e.g. Vercel Firewall rate limiting on /api/*) for a hard limit in production.
 */
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/** Returns a 429 response when the caller is over `limit` requests per minute, otherwise null. */
export function rateLimit(request: NextRequest, key: string, limit = 60): Response | null {
  const now = Date.now();
  const id = `${key}:${clientIp(request)}`;
  const bucket = buckets.get(id);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > 10_000) {
      // Drop expired entries so the map can't grow without bound.
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return null;
  }

  bucket.count += 1;
  if (bucket.count <= limit) return null;
  const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
  return Response.json(
    { error: "Too many requests. Slow down a little." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
