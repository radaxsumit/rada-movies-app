"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for client components. Row Level Security decides what it can read/write. */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
