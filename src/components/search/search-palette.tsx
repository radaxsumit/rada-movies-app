"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { FilmIcon, Loader2Icon, TvIcon, UserIcon } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { personHref, titleHref } from "@/lib/routes";
import { posterUrl, profileUrl } from "@/lib/tmdb/images";
import type { PersonCard, TitleCard } from "@/lib/tmdb/types";

interface SearchResponse {
  query: string;
  titles: TitleCard[];
  people: PersonCard[];
  totalResults?: number;
  error?: string;
}

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** The search dialog itself. Loaded on demand by <SearchCommand> the first time search opens. */
export default function SearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const query = useDebounced(input.trim(), 250);
  const setOpen = onOpenChange;

  const { data, isFetching, isError } = useQuery({
    queryKey: ["search", query],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
      const json = (await res.json()) as SearchResponse;
      if (!res.ok) throw new Error(json.error ?? "Search failed");
      return json;
    },
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

  const go = (href: string) => {
    setOpen(false);
    setInput("");
    router.push(href);
  };

  const titles = query.length >= 2 ? (data?.titles ?? []) : [];
  const people = query.length >= 2 ? (data?.people ?? []) : [];

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search movies, shows and people"
        className="sm:max-w-xl"
      >
        {/* Results come from the server already ranked, so turn off cmdk's own filtering. */}
        <Command shouldFilter={false} className="bg-popover">
          <CommandInput
            value={input}
            onValueChange={setInput}
            placeholder="Search movies, shows, people…"
            aria-label="Search"
          />
          <CommandList className="max-h-[min(60vh,480px)]">
            {query.length < 2 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Type at least 2 letters. Tip: press <kbd className="rounded border px-1">/</kbd> anywhere to search.
              </p>
            ) : isError ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Search is unavailable right now. Try again in a moment.
              </p>
            ) : (
              <>
                {!isFetching && <CommandEmpty>No matches for “{query}”.</CommandEmpty>}
                {titles.length > 0 && (
                  <CommandGroup heading="Movies & shows">
                    {titles.map((t) => (
                      <CommandItem
                        key={`${t.mediaType}-${t.id}`}
                        value={`${t.mediaType}-${t.id}`}
                        onSelect={() => go(titleHref(t.mediaType, t.id, t.title))}
                        className="gap-3"
                      >
                        <span className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-muted">
                          <Image
                            src={posterUrl(t.posterPath, "w185")}
                            alt=""
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 font-medium">{t.title}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            {t.mediaType === "tv" ? <TvIcon className="size-3" /> : <FilmIcon className="size-3" />}
                            {t.mediaType === "tv" ? "Show" : "Movie"}
                            {t.year && ` · ${t.year}`}
                          </span>
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {people.length > 0 && (
                  <CommandGroup heading="People">
                    {people.map((p) => {
                      const src = profileUrl(p.profilePath);
                      return (
                        <CommandItem
                          key={`person-${p.id}`}
                          value={`person-${p.id}`}
                          onSelect={() => go(personHref(p.id, p.name))}
                          className="gap-3"
                        >
                          <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                            {src ? (
                              <Image src={src} alt="" fill sizes="32px" className="object-cover" />
                            ) : (
                              <UserIcon className="size-4 text-muted-foreground" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-1 font-medium">{p.name}</span>
                            <span className="line-clamp-1 text-xs text-muted-foreground">{p.knownFor}</span>
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
                {(titles.length > 0 || people.length > 0) && (
                  <CommandGroup>
                    <CommandItem
                      value="see-all"
                      onSelect={() => go(`/search?q=${encodeURIComponent(query)}`)}
                      className="justify-center text-ember"
                    >
                      See all results for “{query}”
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
            {isFetching && (
              <div className="flex justify-center py-3" aria-live="polite">
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" aria-label="Searching" />
              </div>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
