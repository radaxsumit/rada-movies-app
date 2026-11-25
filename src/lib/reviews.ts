import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { VerdictId } from "@/config/verdicts";
import { publicClient } from "@/lib/supabase/public";
import type { MediaType } from "@/lib/tmdb/types";

/**
 * Public, cacheable community reads. Every function here uses the anonymous client, so RLS
 * guarantees only public data is returned. Tags are invalidated by the actions in app/actions.
 */

export interface Author {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Review {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  verdict: VerdictId;
  body: string | null;
  hasSpoilers: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  author: Author;
}

export const reviewTags = {
  title: (mediaType: MediaType, tmdbId: number) => `reviews:${mediaType}:${tmdbId}`,
  stats: (mediaType: MediaType, tmdbId: number) => `stats:${mediaType}:${tmdbId}`,
  review: (id: string) => `review:${id}`,
  user: (userId: string) => `user-reviews:${userId}`,
  profile: (userId: string) => `profile:${userId}`,
};

const REVIEW_SELECT =
  "id, tmdb_id, media_type, verdict, body, has_spoilers, like_count, comment_count, created_at, updated_at, author:profiles!reviews_user_id_fkey(id, username, display_name, avatar_url)";

type ReviewRow = {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  verdict: VerdictId;
  body: string | null;
  has_spoilers: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
};

const toAuthor = (a: ReviewRow["author"]): Author => ({
  id: a?.id ?? "",
  username: a?.username ?? "deleted",
  displayName: a?.display_name ?? null,
  avatarUrl: a?.avatar_url ?? null,
});

function toReview(r: ReviewRow): Review {
  return {
    id: r.id,
    tmdbId: r.tmdb_id,
    mediaType: r.media_type,
    verdict: r.verdict,
    body: r.body,
    hasSpoilers: r.has_spoilers,
    likeCount: r.like_count,
    commentCount: r.comment_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    author: toAuthor(r.author),
  };
}

/** Most-liked, then newest reviews for a title. */
export async function getTitleReviews(mediaType: MediaType, tmdbId: number, limit = 30): Promise<Review[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(reviewTags.title(mediaType, tmdbId));

  const { data, error } = await publicClient()
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .order("like_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load reviews: ${error.message}`);
  return (data as unknown as ReviewRow[]).map(toReview);
}

export async function getReview(id: string): Promise<Review | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(reviewTags.review(id));

  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await publicClient().from("reviews").select(REVIEW_SELECT).eq("id", id).maybeSingle();
  return data ? toReview(data as unknown as ReviewRow) : null;
}

export async function getReviewComments(reviewId: string): Promise<Comment[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(reviewTags.review(reviewId));

  const { data, error } = await publicClient()
    .from("review_comments")
    .select(
      "id, body, created_at, parent_id, author:profiles!review_comments_user_id_fkey(id, username, display_name, avatar_url)",
    )
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(`Failed to load comments: ${error.message}`);
  return (
    data as unknown as (Omit<ReviewRow, "author"> & {
      author: ReviewRow["author"];
      body: string;
      parent_id: string | null;
    })[]
  ).map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    parentId: c.parent_id,
    author: toAuthor(c.author),
  }));
}

export interface PublicProfile extends Author {
  bio: string | null;
  joinedAt: string;
}

export async function getProfileByUsername(username: string): Promise<PublicProfile | null> {
  "use cache";
  cacheLife("minutes");

  if (!/^[a-z0-9_]{3,20}$/i.test(username)) return null;
  const { data } = await publicClient()
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!data) return null;
  cacheTag(reviewTags.profile(data.id));
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    joinedAt: data.created_at,
  };
}

export async function getUserReviews(userId: string, limit = 50): Promise<Review[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(reviewTags.user(userId));

  const { data, error } = await publicClient()
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load reviews: ${error.message}`);
  return (data as unknown as ReviewRow[]).map(toReview);
}
