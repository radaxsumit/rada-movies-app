"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { REPORT_REASONS } from "@/config/moderation";
import { getViewer, isAdmin } from "@/lib/auth";
import { reviewTags } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./reviews";

const notSignedIn = { ok: false as const, error: "Sign in to do that.", signIn: true };
const uuid = z.string().uuid();

const reportInput = z
  .object({
    reviewId: uuid.optional(),
    commentId: uuid.optional(),
    reason: z.enum(REPORT_REASONS),
    details: z.string().trim().max(400).optional(),
  })
  .refine((v) => Boolean(v.reviewId) !== Boolean(v.commentId), "Report one review or one comment.");

/** Flag a review or comment for the moderators. One report per person per item. */
export async function reportContent(input: z.input<typeof reportInput>): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  const parsed = reportInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid report." };

  const { reviewId, commentId, reason, details } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: viewer.id,
    review_id: reviewId ?? null,
    comment_id: commentId ?? null,
    reason: details ? `${reason}: ${details}` : reason,
  });
  if (error) {
    if (error.code === "23505") return { ok: true }; // already reported — treat as success
    if (error.message.includes("rate_limited"))
      return { ok: false, error: "You’ve sent a lot of reports. Try again later." };
    return { ok: false, error: "Couldn’t send the report." };
  }
  return { ok: true };
}

/** Admin: dismiss a report, or remove the reported content (which also clears its reports). */
export async function resolveReport(reportId: string, action: "dismiss" | "remove"): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  if (!(await isAdmin())) return { ok: false, error: "Admins only." };
  if (!uuid.safeParse(reportId).success) return { ok: false, error: "Invalid report." };

  const supabase = await createClient();
  const { data: report } = await supabase
    .from("reports")
    .select("id, review_id, comment_id")
    .eq("id", reportId)
    .maybeSingle();
  if (!report) return { ok: false, error: "That report no longer exists." };

  if (action === "dismiss") {
    const { error } = await supabase.from("reports").delete().eq("id", reportId);
    if (error) return { ok: false, error: "Couldn’t dismiss the report." };
    return { ok: true };
  }

  if (report.review_id) {
    const { data: review } = await supabase
      .from("reviews")
      .delete()
      .eq("id", report.review_id)
      .select("tmdb_id, media_type, user_id")
      .maybeSingle();
    if (review) {
      updateTag(reviewTags.title(review.media_type, review.tmdb_id));
      updateTag(reviewTags.stats(review.media_type, review.tmdb_id));
      updateTag(reviewTags.user(review.user_id));
    }
    updateTag(reviewTags.review(report.review_id));
  } else if (report.comment_id) {
    const { data: comment } = await supabase
      .from("review_comments")
      .delete()
      .eq("id", report.comment_id)
      .select("review_id")
      .maybeSingle();
    if (comment) updateTag(reviewTags.review(comment.review_id));
  }
  return { ok: true };
}

/** Permanently delete the signed-in user's account and everything they posted. */
export async function deleteMyAccount(confirmation: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  if (confirmation.trim().toLowerCase() !== viewer.username.toLowerCase()) {
    return { ok: false, error: "Type your username exactly to confirm." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, error: "Couldn’t delete your account. Try again." };
  await supabase.auth.signOut();
  redirect("/?account=deleted");
}
