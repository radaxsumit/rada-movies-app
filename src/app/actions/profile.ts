"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer, safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { status: "idle" | "error" | "saved"; message?: string; field?: string };

const schema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, "3–20 characters: lowercase letters, numbers and underscores."),
  displayName: z.string().trim().max(50, "Keep it under 50 characters.").optional(),
  bio: z.string().trim().max(300, "Keep it under 300 characters.").optional(),
});

const RESERVED = new Set(["admin", "settings", "sign_in", "support", "moderator", "rada", "official"]);

/** Used by both onboarding (/welcome) and /settings/profile. */
export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");

  const parsed = schema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName") ?? undefined,
    bio: formData.get("bio") ?? undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { status: "error", message: issue?.message, field: String(issue?.path[0] ?? "") };
  }
  if (RESERVED.has(parsed.data.username)) {
    return { status: "error", message: "That username is reserved. Try another.", field: "username" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username,
      display_name: parsed.data.displayName || null,
      bio: parsed.data.bio || null,
      needs_onboarding: false,
    })
    .eq("id", viewer.id);

  if (error) {
    if (error.code === "23505") return { status: "error", message: "That username is taken.", field: "username" };
    return { status: "error", message: "Couldn’t save your profile. Try again." };
  }

  updateTag(`profile:${viewer.id}`);

  const next = formData.get("next");
  if (typeof next === "string" && next) redirect(safeNext(next));
  return { status: "saved", message: "Profile saved." };
}
