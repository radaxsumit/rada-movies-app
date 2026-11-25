"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { socialTags } from "@/lib/social";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./reviews";

/** Lists, diary and follows. Same rules as reviews: re-check the user, write via RLS, refresh caches. */

const notSignedIn = { ok: false as const, error: "Sign in to do that.", signIn: true };
const uuid = z.string().uuid();
const titleRef = z.object({ mediaType: z.enum(["movie", "tv"]), tmdbId: z.number().int().positive().max(1e9) });

/* ───────────── Lists ───────────── */

const listInput = z.object({
  title: z.string().trim().min(1, "Give your list a name.").max(100, "Keep the name under 100 characters."),
  description: z.string().trim().max(1000, "Keep the description under 1,000 characters.").optional(),
  isPublic: z.boolean().default(true),
});

function refreshLists(userId: string, listId?: string) {
  updateTag(socialTags.lists(userId));
  updateTag(socialTags.recentLists);
  if (listId) updateTag(socialTags.list(listId));
}

export async function createList(
  input: z.input<typeof listInput> & { firstItem?: z.input<typeof titleRef> },
): Promise<ActionResult<{ id: string }>> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  const parsed = listInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid list." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lists")
    .insert({
      user_id: viewer.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      is_public: parsed.data.isPublic,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn’t create the list." };

  const first = input.firstItem ? titleRef.safeParse(input.firstItem) : null;
  if (first?.success) {
    await supabase
      .from("list_items")
      .insert({ list_id: data.id, tmdb_id: first.data.tmdbId, media_type: first.data.mediaType, position: 0 });
  }

  refreshLists(viewer.id, data.id);
  return { ok: true, data: { id: data.id } };
}

export async function updateList(listId: string, input: z.input<typeof listInput>): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  const parsed = listInput.safeParse(input);
  if (!uuid.safeParse(listId).success || !parsed.success) {
    return {
      ok: false,
      error: parsed.success ? "Invalid list." : (parsed.error.issues[0]?.message ?? "Invalid list."),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("lists")
    .update({ title: parsed.data.title, description: parsed.data.description || null, is_public: parsed.data.isPublic })
    .eq("id", listId)
    .eq("user_id", viewer.id);
  if (error) return { ok: false, error: "Couldn’t save the list." };
  refreshLists(viewer.id, listId);
  return { ok: true };
}

export async function deleteList(listId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  if (!uuid.safeParse(listId).success) return { ok: false, error: "Invalid list." };

  const supabase = await createClient();
  const { error } = await supabase.from("lists").delete().eq("id", listId).eq("user_id", viewer.id);
  if (error) return { ok: false, error: "Couldn’t delete the list." };
  refreshLists(viewer.id, listId);
  return { ok: true };
}

/** Add or remove a title from one of your lists. RLS checks you own the list. */
export async function setListItem(
  listId: string,
  item: z.input<typeof titleRef>,
  included: boolean,
): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  const ref = titleRef.safeParse(item);
  if (!uuid.safeParse(listId).success || !ref.success) return { ok: false, error: "Invalid list or title." };

  const supabase = await createClient();
  if (included) {
    const { count } = await supabase
      .from("list_items")
      .select("tmdb_id", { count: "exact", head: true })
      .eq("list_id", listId);
    const { error } = await supabase
      .from("list_items")
      .upsert(
        { list_id: listId, tmdb_id: ref.data.tmdbId, media_type: ref.data.mediaType, position: count ?? 0 },
        { ignoreDuplicates: true },
      );
    if (error) return { ok: false, error: "Couldn’t add to the list." };
  } else {
    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("list_id", listId)
      .eq("tmdb_id", ref.data.tmdbId)
      .eq("media_type", ref.data.mediaType);
    if (error) return { ok: false, error: "Couldn’t remove from the list." };
  }
  refreshLists(viewer.id, listId);
  return { ok: true };
}

/* ───────────── Diary ───────────── */

const diaryInput = titleRef.extend({
  watchedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date."),
  rewatch: z.boolean().default(false),
});

export async function logWatch(input: z.input<typeof diaryInput>): Promise<ActionResult<{ id: string }>> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  const parsed = diaryInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid entry." };

  // No future dates (allow a day of slack for time zones).
  const latest = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  if (parsed.data.watchedOn > latest || parsed.data.watchedOn < "1900-01-01") {
    return { ok: false, error: "That date doesn’t look right." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("diary_entries")
    .insert({
      user_id: viewer.id,
      tmdb_id: parsed.data.tmdbId,
      media_type: parsed.data.mediaType,
      watched_on: parsed.data.watchedOn,
      rewatch: parsed.data.rewatch,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn’t log that watch." };
  updateTag(socialTags.diary(viewer.id));
  return { ok: true, data: { id: data.id } };
}

export async function deleteDiaryEntry(entryId: string): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  if (!uuid.safeParse(entryId).success) return { ok: false, error: "Invalid entry." };
  const supabase = await createClient();
  const { error } = await supabase.from("diary_entries").delete().eq("id", entryId).eq("user_id", viewer.id);
  if (error) return { ok: false, error: "Couldn’t delete that entry." };
  updateTag(socialTags.diary(viewer.id));
  return { ok: true };
}

/* ───────────── Follows ───────────── */

export async function setFollow(userId: string, following: boolean): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return notSignedIn;
  if (!uuid.safeParse(userId).success) return { ok: false, error: "Invalid user." };
  if (userId === viewer.id) return { ok: false, error: "You can’t follow yourself." };

  const supabase = await createClient();
  const { error } = following
    ? await supabase
        .from("follows")
        .upsert({ follower_id: viewer.id, following_id: userId }, { ignoreDuplicates: true })
    : await supabase.from("follows").delete().eq("follower_id", viewer.id).eq("following_id", userId);
  if (error) return { ok: false, error: "Couldn’t update follow." };
  updateTag(socialTags.follows(userId));
  updateTag(socialTags.follows(viewer.id));
  return { ok: true };
}
