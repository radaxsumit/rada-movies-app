import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie before each page request, so Server Components
 * always see a valid session. (Next.js 16 renamed middleware.ts to proxy.ts.)
 * It does not block or redirect: pages that need a user check for one themselves.
 */
export async function proxy(request: NextRequest) {
  // Safety net for sign-in links: if Supabase falls back to the Site URL (e.g. the return address
  // isn't in its Redirect URLs list), the one-time ?code= lands on a normal page. Hand it to the
  // callback route so the sign-in still completes, then return to that page.
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  if (code && !pathname.startsWith("/auth/")) {
    const callback = request.nextUrl.clone();
    callback.pathname = "/auth/callback";
    callback.search = "";
    callback.searchParams.set("code", code);
    const rest = new URLSearchParams(searchParams);
    rest.delete("code");
    const back = `${pathname}${rest.size ? `?${rest}` : ""}`;
    callback.searchParams.set("next", back);
    return NextResponse.redirect(callback);
  }

  let response = NextResponse.next({ request });

  // Skip the auth round-trip for visitors who have never signed in.
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getUser() validates the token with Supabase and triggers a refresh when it has expired.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Pages only: skip static files, images, the image optimizer and our public API routes.
  matcher: ["/((?!_next/static|_next/image|api/|icon.svg|images/|brand/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
