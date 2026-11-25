"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { status: "idle" | "sent" | "error"; message?: string; email?: string };

/**
 * Base URL for auth redirects. Prefer the configured site URL over the Host header, which a
 * client can spoof. (Supabase also rejects redirects not in its allow list.)
 */
async function origin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

const emailSchema = z.string().trim().toLowerCase().email().max(254);

/** Sends a one-click sign-in link. New emails get an account automatically. */
export async function sendMagicLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", message: "Enter a valid email address." };

  const next = safeNext(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error) {
    const rateLimited = error.status === 429 || /rate limit/i.test(error.message);
    return {
      status: "error",
      message: rateLimited
        ? "Too many sign-in emails right now. Please wait a few minutes and try again."
        : "We couldn’t send the email. Check the address and try again.",
    };
  }
  return { status: "sent", email: parsed.data };
}

/** Starts Google sign-in. Works once Google is enabled in Supabase → Authentication → Providers. */
export async function signInWithGoogle(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`/sign-in?error=google_unavailable&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
