import "server-only";
import { serverEnv } from "@/lib/env";

/**
 * api.tmdb.org is TMDB's alternate API host. Some Indian ISPs reset connections to
 * api.themoviedb.org, while this host works everywhere.
 */
const API_BASE = "https://api.tmdb.org/3";

export class TmdbError extends Error {
  constructor(
    public status: number,
    public path: string,
  ) {
    super(`TMDB ${status} for ${path}`);
  }
}

/**
 * Low-level fetch. Runs only on the server, so the token never reaches the browser.
 * Callers add `'use cache'` + `cacheLife` to decide how fresh each kind of data is.
 */
export async function tmdbFetch<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(API_BASE + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { accept: "application/json", Authorization: `Bearer ${serverEnv().TMDB_READ_TOKEN}` },
  });
  if (!res.ok) throw new TmdbError(res.status, path);
  return (await res.json()) as T;
}

/** Like tmdbFetch, but returns null for a 404 so pages can call notFound(). */
export async function tmdbFetchOrNull<T>(path: string, params: Record<string, string | number | undefined> = {}) {
  try {
    return await tmdbFetch<T>(path, params);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return null;
    throw error;
  }
}
