import "server-only";
import { cacheLife } from "next/cache";

/**
 * Which sign-in providers are switched on in Supabase (Authentication → Providers).
 * Lets the UI hide buttons for providers that aren't configured yet instead of sending
 * people to an error page. Cached briefly, so enabling one shows up within minutes.
 */
export async function getEnabledProviders(): Promise<{ google: boolean }> {
  "use cache";
  cacheLife("minutes");

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
    });
    if (!res.ok) return { google: false };
    const data = (await res.json()) as { external?: Record<string, boolean> };
    return { google: Boolean(data.external?.google) };
  } catch {
    return { google: false };
  }
}
