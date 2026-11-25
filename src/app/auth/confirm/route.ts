import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["email", "magiclink", "signup", "invite", "recovery", "email_change"];

/**
 * Sign-in via token hash: /auth/confirm?token_hash=…&type=email&next=/path
 * Unlike the ?code= flow (/auth/callback), this works when the email link is opened in a different
 * browser or device, because it doesn't depend on a cookie from the browser that asked for the link.
 * Used by the email template in Supabase → Authentication → Emails (see README).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (!tokenHash || !type || !TYPES.includes(type)) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/sign-in?error=link_expired`);
  }

  const { data: profile } = await supabase.from("profiles").select("needs_onboarding").eq("id", data.user.id).single();
  const destination = profile?.needs_onboarding ? `/welcome?next=${encodeURIComponent(next)}` : next;
  return NextResponse.redirect(`${origin}${destination}`);
}
