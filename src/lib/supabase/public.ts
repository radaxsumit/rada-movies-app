import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { MediaType } from "@/lib/tmdb/types";
import type { Database } from "./database.types";

/**
 * Cookie-less Supabase client for public, cacheable reads (verdict stats, public reviews).
 * It acts as the anonymous role, so RLS only lets it see public rows.
 */
export function publicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export interface TitleStats {
  reviewCount: number;
  counts: { skip: number; one_time: number; must_watch: number; masterpiece: number };
}

const EMPTY: TitleStats = { reviewCount: 0, counts: { skip: 0, one_time: 0, must_watch: 0, masterpiece: 0 } };

/** Verdict breakdown for a title. Cached briefly; Phase 3 revalidates the tag when a review is posted. */
export async function getTitleStats(mediaType: MediaType, tmdbId: number): Promise<TitleStats> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`stats:${mediaType}:${tmdbId}`);

  const { data, error } = await publicClient()
    .from("title_stats")
    .select("review_count, skip_count, one_time_count, must_watch_count, masterpiece_count")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  // Stats are a nice-to-have on the page: fail soft rather than break the title page.
  if (error || !data) return EMPTY;
  return {
    reviewCount: data.review_count,
    counts: {
      skip: data.skip_count,
      one_time: data.one_time_count,
      must_watch: data.must_watch_count,
      masterpiece: data.masterpiece_count,
    },
  };
}
