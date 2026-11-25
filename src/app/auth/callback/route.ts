import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Where magic links and Google sign-in land. Exchanges the one-time code for a session
 * cookie, then sends new users to pick a username and everyone else back where they were.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) {
    const reason = searchParams.get("error_description") ?? "missing_code";
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent(reason)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent("link_expired")}`);
  }

  const { data: profile } = await supabase.from("profiles").select("needs_onboarding").eq("id", data.user.id).single();

  const destination = profile?.needs_onboarding ? `/welcome?next=${encodeURIComponent(next)}` : next;
  return NextResponse.redirect(`${origin}${destination}`);
}
