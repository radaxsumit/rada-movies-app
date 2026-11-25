"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkCheckIcon, BookmarkPlusIcon, PenLineIcon } from "lucide-react";
import { toast } from "sonner";
import { setWatchlist } from "@/app/actions/reviews";
import { useViewer } from "@/components/auth/viewer-provider";
import { Button } from "@/components/ui/button";
import { getVerdict } from "@/config/verdicts";
import { createClient } from "@/lib/supabase/client";
import type { MediaType } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";
import { useRequireSignIn } from "./review-bits";
import { ReviewComposer, type MyReview } from "./review-composer";

/** Watchlist + Review buttons for a title page. Viewer state loads client-side so the page stays cached. */
export function TitleActions({ mediaType, tmdbId, title }: { mediaType: MediaType; tmdbId: number; title: string }) {
  const { viewer } = useViewer();
  const requireSignIn = useRequireSignIn();
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const { data: mine } = useQuery({
    queryKey: ["my-review", mediaType, tmdbId, viewer?.id],
    enabled: !!viewer,
    queryFn: async (): Promise<MyReview | null> => {
      const { data } = await createClient()
        .from("reviews")
        .select("id, verdict, body, has_spoilers")
        .eq("user_id", viewer!.id)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", mediaType)
        .maybeSingle();
      return data ? { id: data.id, verdict: data.verdict, body: data.body, hasSpoilers: data.has_spoilers } : null;
    },
  });

  const watchKey = ["watchlist-has", mediaType, tmdbId, viewer?.id];
  const { data: saved = false } = useQuery({
    queryKey: watchKey,
    enabled: !!viewer,
    queryFn: async () => {
      const { count } = await createClient()
        .from("watchlist")
        .select("tmdb_id", { count: "exact", head: true })
        .eq("user_id", viewer!.id)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", mediaType);
      return (count ?? 0) > 0;
    },
  });

  const toggleWatchlist = () => {
    if (!viewer) return requireSignIn();
    const next = !saved;
    queryClient.setQueryData(watchKey, next);
    startTransition(async () => {
      const res = await setWatchlist({ mediaType, tmdbId, saved: next });
      if (!res.ok) {
        queryClient.setQueryData(watchKey, !next);
        toast.error(res.error);
      } else {
        toast.success(next ? "Added to your watchlist" : "Removed from your watchlist");
        void queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      }
    });
  };

  const myVerdict = mine ? getVerdict(mine.verdict) : null;

  return (
    <>
      <Button
        size="lg"
        variant="secondary"
        className={cn("gap-2 rounded-full", saved && "border border-ember/60 bg-ember-soft")}
        onClick={toggleWatchlist}
        disabled={pending}
        aria-pressed={saved}
      >
        {saved ? <BookmarkCheckIcon className="size-4 text-ember" /> : <BookmarkPlusIcon className="size-4" />}
        {saved ? "On watchlist" : "Watchlist"}
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className="gap-2 rounded-full"
        onClick={() => (viewer ? setComposerOpen(true) : requireSignIn())}
      >
        {myVerdict ? (
          <>
            <span className={cn("size-2 rounded-full", myVerdict.bgClass)} />
            You said: {myVerdict.label}
          </>
        ) : (
          <>
            <PenLineIcon className="size-4" />
            Give your verdict
          </>
        )}
      </Button>

      {viewer && (
        <ReviewComposer
          open={composerOpen}
          onOpenChange={setComposerOpen}
          mediaType={mediaType}
          tmdbId={tmdbId}
          title={title}
          existing={mine ?? null}
        />
      )}
    </>
  );
}
