"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { reviewTags } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";

/**
 * Every action re-checks the signed-in user on the server (never trusting the client), writes
 * through the user's own Supabase session so RLS applies, then refreshes the affected caches.
 */

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; signIn?: boolean };

const notSignedIn = { ok: false as const, error: "Sign in to do that.", signIn: true };
const mediaType = z.enum(["movie", "tv"]);
const tmdbId = z.number().int().positive().max(1e9);
const uuid = z.string().uuid();

function refreshTitle(type: "movie" | "tv", id: number, userId: string) {
  updateTag(reviewTags.title(type, id));
  updateTag(reviewTags.stats(type, id));
  updateTag(reviewTags.user(userId));
}

/* ───────────── Reviews ───────────── */

const reviewInput = z.object({
  mediaType,
  tmdbId,
  verdict: z.enum(["skip", "one_time", "must_watch", "masterpiece"]),
  body: z.string().trim().max(5000, "Reviews are limited to 5,000 characters.").optional(),
  hasSpoilers: z.boolean().default(false),
});

export async function saveReview(input: z.input<typeof reviewInput>): Promise<ActionResult<{ id: string }>> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  const parsed = reviewInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review." };
  const { mediaType: type, tmdbId: id, verdict, body, hasSpoilers } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      {
        user_id: viewer.id,
        tmdb_id: id,
        media_type: type,
        verdict,
        body: body || null,
        has_spoilers: hasSpoilers,
      },
      { onConflict: "user_id,tmdb_id,media_type" },
    )
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn’t save your review. Try again." };

  refreshTitle(type, id, viewer.id);
  updateTag(reviewTags.review(data.id));
  return { ok: true, data: { id: data.id } };
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  if (!uuid.safeParse(reviewId).success) return { ok: false, error: "Invalid review." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", viewer.id)
    .select("tmdb_id, media_type")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Couldn’t delete that review." };

  refreshTitle(data.media_type, data.tmdb_id, viewer.id);
  updateTag(reviewTags.review(reviewId));
  return { ok: true };
}

/* ───────────── Likes ───────────── */

export async function setLike(reviewId: string, liked: boolean): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  if (!uuid.safeParse(reviewId).success) return { ok: false, error: "Invalid review." };

  const supabase = await createClient();
  const { error } = liked
    ? await supabase
        .from("review_likes")
        .upsert({ review_id: reviewId, user_id: viewer.id }, { ignoreDuplicates: true })
    : await supabase.from("review_likes").delete().eq("review_id", reviewId).eq("user_id", viewer.id);
  if (error) return { ok: false, error: "Couldn’t update your like." };

  const { data: review } = await supabase
    .from("reviews")
    .select("tmdb_id, media_type, user_id")
    .eq("id", reviewId)
    .single();
  updateTag(reviewTags.review(reviewId));
  if (review) {
    updateTag(reviewTags.title(review.media_type, review.tmdb_id));
    updateTag(reviewTags.user(review.user_id));
  }
  return { ok: true };
}

/* ───────────── Comments ───────────── */

const commentInput = z.object({
  reviewId: uuid,
  body: z.string().trim().min(1, "Write something first.").max(2000, "Comments are limited to 2,000 characters."),
  parentId: uuid.optional(),
});

export async function addComment(input: z.input<typeof commentInput>): Promise<ActionResult<{ id: string }>> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  const parsed = commentInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("review_comments")
    .insert({
      review_id: parsed.data.reviewId,
      user_id: viewer.id,
      body: parsed.data.body,
      parent_id: parsed.data.parentId ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn’t post your comment." };

  const { data: review } = await supabase
    .from("reviews")
    .select("tmdb_id, media_type, user_id")
    .eq("id", parsed.data.reviewId)
    .single();
  updateTag(reviewTags.review(parsed.data.reviewId));
  if (review) {
    updateTag(reviewTags.title(review.media_type, review.tmdb_id));
    updateTag(reviewTags.user(review.user_id));
  }
  return { ok: true, data: { id: data.id } };
}

export async function deleteComment(commentId: string, reviewId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  if (!uuid.safeParse(commentId).success || !uuid.safeParse(reviewId).success) {
    return { ok: false, error: "Invalid comment." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("review_comments").delete().eq("id", commentId).eq("user_id", viewer.id);
  if (error) return { ok: false, error: "Couldn’t delete that comment." };
  updateTag(reviewTags.review(reviewId));
  return { ok: true };
}

/* ───────────── Watchlist ───────────── */

export async function setWatchlist(input: {
  mediaType: "movie" | "tv";
  tmdbId: number;
  saved: boolean;
}): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  if (!mediaType.safeParse(input.mediaType).success || !tmdbId.safeParse(input.tmdbId).success) {
    return { ok: false, error: "Invalid title." };
  }

  const supabase = await createClient();
  const row = { user_id: viewer.id, tmdb_id: input.tmdbId, media_type: input.mediaType };
  const { error } = input.saved
    ? await supabase.from("watchlist").upsert(row, { ignoreDuplicates: true })
    : await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", viewer.id)
        .eq("tmdb_id", input.tmdbId)
        .eq("media_type", input.mediaType);
  if (error) return { ok: false, error: "Couldn’t update your watchlist." };
  return { ok: true };
}
