"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { createClient as CreateClient } from "@/lib/supabase/client";

export interface ClientViewer {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface ViewerContextValue {
  viewer: ClientViewer | null;
  /** true until the first session check finishes — render neutral UI meanwhile. */
  loading: boolean;
  refresh: () => Promise<void>;
}

const ViewerContext = createContext<ViewerContextValue>({ viewer: null, loading: true, refresh: async () => {} });

type Client = ReturnType<typeof CreateClient>;

/** Supabase keeps the session in cookies named "sb-<project>-auth-token…". */
function hasSessionCookie() {
  return document.cookie.split(";").some((c) => c.trim().startsWith("sb-") && c.includes("auth-token"));
}

/**
 * Client-side session state for interactive bits (user menu, like buttons, watchlist).
 * Pages stay cacheable because the server never has to read cookies to render them.
 * Writes still go through Server Actions or RLS-protected queries, so this is UI state only.
 *
 * Performance: the Supabase SDK (~290 KB) is only downloaded when a session cookie exists, so
 * visitors who never signed in don't pay for it.
 */
export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<Client | null>(null);
  const [viewer, setViewer] = useState<ClientViewer | null>(null);
  const [loading, setLoading] = useState(true);

  const getClient = useCallback(async () => {
    if (!clientRef.current) {
      const { createClient } = await import("@/lib/supabase/client");
      clientRef.current = createClient();
    }
    return clientRef.current;
  }, []);

  const load = useCallback(
    async (userId: string | null) => {
      if (!userId) {
        setViewer(null);
        setLoading(false);
        return;
      }
      const supabase = await getClient();
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("id", userId)
        .single();
      setViewer(
        data
          ? { id: userId, username: data.username, displayName: data.display_name, avatarUrl: data.avatar_url }
          : null,
      );
      setLoading(false);
    },
    [getClient],
  );

  const refresh = useCallback(async () => {
    if (!hasSessionCookie()) return load(null);
    const supabase = await getClient();
    const { data } = await supabase.auth.getUser();
    await load(data.user?.id ?? null);
  }, [getClient, load]);

  useEffect(() => {
    // Never signed in on this browser: nothing to load. Defer the state update out of the effect body.
    if (!hasSessionCookie()) {
      const t = setTimeout(() => void load(null), 0);
      return () => clearTimeout(t);
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void getClient().then((supabase) => {
      if (cancelled) return;
      // onAuthStateChange fires INITIAL_SESSION on subscribe, which covers the first load.
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        // Defer the profile query out of the auth callback (Supabase recommends not awaiting inside it).
        setTimeout(() => void load(session?.user.id ?? null), 0);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [getClient, load]);

  return <ViewerContext value={{ viewer, loading, refresh }}>{children}</ViewerContext>;
}

export function useViewer() {
  return useContext(ViewerContext);
}
