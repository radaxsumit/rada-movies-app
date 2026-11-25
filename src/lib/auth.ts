import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface Viewer {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  needsOnboarding: boolean;
}

/**
 * Data Access Layer for "who is signed in". Reads the session cookie, so call it only
 * inside <Suspense> or from Server Actions / Route Handlers. Returns a narrow object,
 * never the raw session.
 */
export async function getViewer(): Promise<Viewer | null> {
  // Session checks compare token expiry with the clock (Date.now), which Next.js forbids while
  // prerendering or runtime-prefetching. Wait for a real request before touching the session.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, needs_onboarding")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return {
    id: user.id,
    username: profile.username,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    needsOnboarding: profile.needs_onboarding,
  };
}

/** For pages that only make sense signed in: sends visitors to sign-in, then back here. */
export async function requireViewer(returnTo: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return viewer;
}

/** Only allow same-site relative paths as post-login redirects (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/") {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
