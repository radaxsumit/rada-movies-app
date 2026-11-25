"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

/**
 * Client-side session state for interactive bits (user menu, like buttons, watchlist).
 * Pages stay cacheable because the server never has to read cookies to render them.
 * Writes still go through Server Actions or RLS-protected queries, so this is UI state only.
 */
export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [viewer, setViewer] = useState<ClientViewer | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (userId: string | null) => {
      if (!userId) {
        setViewer(null);
        setLoading(false);
        return;
      }
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
    [supabase],
  );

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    await load(data.user?.id ?? null);
  }, [supabase, load]);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on subscribe, which covers the first load.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer the profile query out of the auth callback (Supabase recommends not awaiting inside it).
      setTimeout(() => void load(session?.user.id ?? null), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, load]);

  return <ViewerContext value={{ viewer, loading, refresh }}>{children}</ViewerContext>;
}

export function useViewer() {
  return useContext(ViewerContext);
}
