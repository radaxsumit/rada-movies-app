import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 * It reads the user's session cookie, so call it outside `'use cache'` scopes
 * and inside a <Suspense> boundary (see Next.js "Working with runtime APIs").
 *
 * Phase 3 adds `src/proxy.ts` to refresh the session cookie on each request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component, where cookies are read-only. The proxy refreshes them instead.
          }
        },
      },
    },
  );
}
