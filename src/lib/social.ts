import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Author } from "@/lib/reviews";
import { publicClient } from "@/lib/supabase/public";
import type { MediaType } from "@/lib/tmdb/types";

/**
 * Public, cacheable reads for lists, diary and follows (anonymous client, so RLS only returns
 * public rows). Invalidated by the actions in app/actions/social.ts.
 */

export const socialTags = {
  lists: (userId: string) => `lists:${userId}`,
  list: (listId: string) => `list:${listId}`,
  recentLists: "lists:recent",
  diary: (userId: string) => `diary:${userId}`,
  follows: (userId: string) => `follows:${userId}`,
};

export interface ListSummary {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  itemCount: number;
  /** First few items, for poster collages. */
  preview: { tmdbId: number; mediaType: MediaType }[];
  owner: Author;
}

export interface ListItem {
  tmdbId: number;
  mediaType: MediaType;
  position: number;
  note: string | null;
}

export interface ListDetail extends ListSummary {
  items: ListItem[];
}

export interface DiaryEntry {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  watchedOn: string;
  rewatch: boolean;
}

type ListRow = {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  owner: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
  list_items: { tmdb_id: number; media_type: MediaType; position: number; note: string | null }[];
};

const LIST_SELECT =
  "id, title, description, is_public, created_at, owner:profiles!lists_user_id_fkey(id, username, display_name, avatar_url), list_items(tmdb_id, media_type, position, note)";

function toSummary(r: ListRow): ListDetail {
  const items = [...r.list_items]
    .sort((a, b) => a.position - b.position)
    .map((i) => ({ tmdbId: i.tmdb_id, mediaType: i.media_type, position: i.position, note: i.note }));
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    isPublic: r.is_public,
    createdAt: r.created_at,
    itemCount: items.length,
    preview: items.slice(0, 4).map(({ tmdbId, mediaType }) => ({ tmdbId, mediaType })),
    owner: {
      id: r.owner?.id ?? "",
      username: r.owner?.username ?? "deleted",
      displayName: r.owner?.display_name ?? null,
      avatarUrl: r.owner?.avatar_url ?? null,
    },
    items,
  };
}

/** A user's public lists, newest first. */
export async function getPublicLists(userId: string): Promise<ListSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(socialTags.lists(userId));

  const { data, error } = await publicClient()
    .from("lists")
    .select(LIST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Failed to load lists: ${error.message}`);
  return (data as unknown as ListRow[]).map(toSummary);
}

/** Recently created public lists with at least one title, for /lists. */
export async function getRecentLists(): Promise<ListSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(socialTags.recentLists);

  const { data, error } = await publicClient()
    .from("lists")
    .select(LIST_SELECT)
    .order("created_at", { ascending: false })
    .limit(48);
  if (error) throw new Error(`Failed to load lists: ${error.message}`);
  return (data as unknown as ListRow[]).map(toSummary).filter((l) => l.itemCount > 0);
}

/** A public list. Private lists return null here; owners load them with their own session. */
export async function getPublicList(id: string): Promise<ListDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(socialTags.list(id));

  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await publicClient().from("lists").select(LIST_SELECT).eq("id", id).maybeSingle();
  return data ? toSummary(data as unknown as ListRow) : null;
}

export { LIST_SELECT, toSummary, type ListRow };

export async function getDiary(userId: string, limit = 200): Promise<DiaryEntry[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(socialTags.diary(userId));

  const { data, error } = await publicClient()
    .from("diary_entries")
    .select("id, tmdb_id, media_type, watched_on, rewatch")
    .eq("user_id", userId)
    .order("watched_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load diary: ${error.message}`);
  return data.map((d) => ({
    id: d.id,
    tmdbId: d.tmdb_id,
    mediaType: d.media_type,
    watchedOn: d.watched_on,
    rewatch: d.rewatch,
  }));
}

export interface FollowCounts {
  followers: number;
  following: number;
}

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  "use cache";
  cacheLife("minutes");
  cacheTag(socialTags.follows(userId));

  const supabase = publicClient();
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}
