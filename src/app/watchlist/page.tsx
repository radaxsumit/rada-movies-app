import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BookmarkIcon } from "lucide-react";
import { TitleCard } from "@/components/titles/title-card";
import { TitleGridSkeleton, titleGridClass } from "@/components/titles/title-grid";
import { Button } from "@/components/ui/button";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTitleCards } from "@/lib/tmdb/lookup";

export const metadata: Metadata = { title: "Your watchlist", robots: { index: false } };

export default function WatchlistPage() {
  return (
    <div className="container-page space-y-8 pt-28 pb-10">
      <h1 className="font-display text-5xl leading-none tracking-wide">Your watchlist</h1>
      <Suspense fallback={<TitleGridSkeleton count={12} />}>
        <Watchlist />
      </Suspense>
    </div>
  );
}

async function Watchlist() {
  const viewer = await requireViewer("/watchlist");
  const supabase = await createClient();
  const { data } = await supabase
    .from("watchlist")
    .select("tmdb_id, media_type, created_at")
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const titles = await getTitleCards((data ?? []).map((r) => ({ mediaType: r.media_type, tmdbId: r.tmdb_id })));

  if (titles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
        <BookmarkIcon className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">Nothing saved yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Tap <span className="font-medium text-foreground">Watchlist</span> on any movie or show to save it for later.
        </p>
        <Button asChild className="mt-2 rounded-full">
          <Link href="/movies">Find something to watch</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {titles.length} saved title{titles.length === 1 ? "" : "s"}
      </p>
      <ul className={titleGridClass}>
        {titles.map((t) => (
          <li key={`${t.mediaType}-${t.id}`}>
            <TitleCard title={t} className="w-full sm:w-full" />
          </li>
        ))}
      </ul>
    </>
  );
}
