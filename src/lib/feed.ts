import "server-only";
import type { VerdictId } from "@/config/verdicts";
import type { Author } from "@/lib/reviews";
import { publicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { MediaType } from "@/lib/tmdb/types";

/**
 * Activity from people the viewer follows: verdicts, diary entries and new public lists,
 * merged newest-first. Per-viewer, so it is rendered at request time (not cached).
 */

type Ref = { mediaType: MediaType; tmdbId: number };

export type FeedItem =
  | ({
      kind: "review";
      id: string;
      at: string;
      author: Author;
      verdict: VerdictId;
      body: string | null;
      hasSpoilers: boolean;
    } & Ref)
  | ({ kind: "watch"; id: string; at: string; author: Author; watchedOn: string; rewatch: boolean } & Ref)
  | { kind: "list"; id: string; at: string; author: Author; title: string; itemCount: number };

type AuthorRow = { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
const toAuthor = (a: AuthorRow): Author => ({
  id: a?.id ?? "",
  username: a?.username ?? "deleted",
  displayName: a?.display_name ?? null,
  avatarUrl: a?.avatar_url ?? null,
});

export async function getFollowingIds(viewerId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", viewerId).limit(1000);
  return (data ?? []).map((r) => r.following_id);
}

export async function getFeed(viewerId: string, limit = 40): Promise<FeedItem[]> {
  const following = await getFollowingIds(viewerId);
  if (following.length === 0) return [];

  // Community data is public, so the anonymous client is enough (and RLS hides private lists).
  const db = publicClient();
  const [reviews, diary, lists] = await Promise.all([
    db
      .from("reviews")
      .select(
        "id, tmdb_id, media_type, verdict, body, has_spoilers, created_at, author:profiles!reviews_user_id_fkey(id, username, display_name, avatar_url)",
      )
      .in("user_id", following)
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("diary_entries")
      .select(
        "id, tmdb_id, media_type, watched_on, rewatch, created_at, author:profiles!diary_entries_user_id_fkey(id, username, display_name, avatar_url)",
      )
      .in("user_id", following)
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("lists")
      .select(
        "id, title, created_at, list_items(count), author:profiles!lists_user_id_fkey(id, username, display_name, avatar_url)",
      )
      .in("user_id", following)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const items: FeedItem[] = [
    ...(
      (reviews.data ?? []) as unknown as {
        id: string;
        tmdb_id: number;
        media_type: MediaType;
        verdict: VerdictId;
        body: string | null;
        has_spoilers: boolean;
        created_at: string;
        author: AuthorRow;
      }[]
    ).map((r) => ({
      kind: "review" as const,
      id: r.id,
      at: r.created_at,
      author: toAuthor(r.author),
      verdict: r.verdict,
      body: r.body,
      hasSpoilers: r.has_spoilers,
      mediaType: r.media_type,
      tmdbId: r.tmdb_id,
    })),
    ...(
      (diary.data ?? []) as unknown as {
        id: string;
        tmdb_id: number;
        media_type: MediaType;
        watched_on: string;
        rewatch: boolean;
        created_at: string;
        author: AuthorRow;
      }[]
    ).map((d) => ({
      kind: "watch" as const,
      id: d.id,
      at: d.created_at,
      author: toAuthor(d.author),
      watchedOn: d.watched_on,
      rewatch: d.rewatch,
      mediaType: d.media_type,
      tmdbId: d.tmdb_id,
    })),
    ...(
      (lists.data ?? []) as unknown as {
        id: string;
        title: string;
        created_at: string;
        list_items: { count: number }[];
        author: AuthorRow;
      }[]
    ).map((l) => ({
      kind: "list" as const,
      id: l.id,
      at: l.created_at,
      author: toAuthor(l.author),
      title: l.title,
      itemCount: l.list_items[0]?.count ?? 0,
    })),
  ];

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/** People worth following when your feed is empty: the most recent reviewers. */
export async function getSuggestedPeople(excludeIds: string[], limit = 8): Promise<Author[]> {
  const { data } = await publicClient()
    .from("reviews")
    .select("author:profiles!reviews_user_id_fkey(id, username, display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(100);
  const seen = new Set(excludeIds);
  const out: Author[] = [];
  for (const row of (data ?? []) as unknown as { author: AuthorRow }[]) {
    const a = toAuthor(row.author);
    if (!a.id || seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}
