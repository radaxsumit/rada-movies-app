"use client";

import { useCallback, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { TitleCard } from "@/components/titles/title-card";
import { Button } from "@/components/ui/button";
import type { TitlePage } from "@/lib/tmdb/discover";
import type { MediaType } from "@/lib/tmdb/types";

/**
 * Appends pages 2..n below the server-rendered first page. Loads automatically when the
 * sentinel scrolls into view, with a button as the accessible fallback.
 */
export function LoadMore({
  mediaType,
  query,
  totalPages,
  gridClass,
}: {
  mediaType: MediaType;
  /** Filter query string (without type/page), e.g. "genre=28&sort=top". */
  query: string;
  totalPages: number;
  gridClass: string;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const { data, fetchNextPage, refetch, hasNextPage, isFetching, isError } = useInfiniteQuery({
    queryKey: ["discover", mediaType, query],
    initialPageParam: 2,
    queryFn: async ({ pageParam, signal }) => {
      const res = await fetch(`/api/discover?type=${mediaType}&page=${pageParam}${query ? `&${query}` : ""}`, {
        signal,
      });
      if (!res.ok) throw new Error("Failed to load");
      return (await res.json()) as TitlePage;
    },
    getNextPageParam: (last) => (last.page < Math.min(last.totalPages, totalPages) ? last.page + 1 : undefined),
    enabled: false, // first fetch is triggered by scroll/click, not on mount
  });

  const morePages = data ? hasNextPage : totalPages > 1;
  // The query starts disabled, so the first load is a refetch (page 2); later loads append.
  const loadNext = useCallback(() => (data ? fetchNextPage() : refetch()), [data, fetchNextPage, refetch]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !morePages) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetching) void loadNext();
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [morePages, isFetching, loadNext]);

  const seen = new Set<string>();
  const titles = (data?.pages ?? [])
    .flatMap((p) => p.results)
    .filter((t) => {
      // TMDB pages can overlap when popularity shifts between requests.
      const key = `${t.mediaType}-${t.id}`;
      return seen.has(key) ? false : (seen.add(key), true);
    });

  return (
    <>
      {titles.length > 0 && (
        <ul className={gridClass}>
          {titles.map((t) => (
            <li key={`${t.mediaType}-${t.id}`}>
              <TitleCard title={t} className="w-full sm:w-full" />
            </li>
          ))}
        </ul>
      )}
      <div ref={sentinel} className="flex justify-center py-8">
        {isFetching ? (
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" aria-label="Loading more" />
        ) : isError ? (
          <Button variant="secondary" className="rounded-full" onClick={() => void loadNext()}>
            Couldn’t load more — try again
          </Button>
        ) : morePages ? (
          <Button variant="secondary" className="rounded-full" onClick={() => void loadNext()}>
            Load more
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">That’s everything.</p>
        )}
      </div>
    </>
  );
}
