import { Suspense } from "react";
import { TitleCard } from "@/components/titles/title-card";
import { TitleGridSkeleton, titleGridClass } from "@/components/titles/title-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { languageOptions, moods, sortOptions, streamingServices } from "@/config/discovery";
import { filtersToSearchParams, parseFilters } from "@/lib/discover-params";
import { discover, getGenres, getKeywordName, type DiscoverFilters } from "@/lib/tmdb/discover";
import type { MediaType } from "@/lib/tmdb/types";
import { FilterBar } from "./filter-bar";
import { LoadMore } from "./load-more";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Shared /movies and /tv page: heading, filters, first page server-rendered, the rest on scroll. */
export function BrowseView({ mediaType, searchParams }: { mediaType: MediaType; searchParams: SearchParams }) {
  return (
    <div className="container-page space-y-8 pt-28 pb-8">
      <Suspense fallback={<BrowseSkeleton />}>
        <BrowseContent mediaType={mediaType} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BrowseContent({ mediaType, searchParams }: { mediaType: MediaType; searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  const [page, genres, keywordName] = await Promise.all([
    discover(mediaType, filters, 1),
    getGenres(mediaType),
    filters.keyword ? getKeywordName(filters.keyword) : Promise.resolve(null),
  ]);
  const query = filtersToSearchParams(filters).toString();
  const heading = browseHeading(mediaType, filters, genres, keywordName);

  return (
    <>
      <header className="space-y-2">
        <h1 className="font-display text-5xl leading-none tracking-wide sm:text-6xl">{heading}</h1>
        <p className="text-sm text-muted-foreground">
          {page.totalResults.toLocaleString("en-IN")} {mediaType === "tv" ? "shows" : "movies"}
        </p>
      </header>

      <FilterBar filters={filters} genres={genres} keywordName={keywordName} />

      {page.results.length === 0 ? (
        <p className="py-24 text-center text-muted-foreground">Nothing matches these filters. Try removing one.</p>
      ) : (
        <div>
          <ul className={titleGridClass}>
            {page.results.map((t, i) => (
              <li key={`${t.mediaType}-${t.id}`}>
                <TitleCard title={t} className="w-full sm:w-full" priority={i < 6} />
              </li>
            ))}
          </ul>
          {/* key resets the client list whenever filters change */}
          <LoadMore
            key={query}
            mediaType={mediaType}
            query={query}
            totalPages={page.totalPages}
            gridClass={`${titleGridClass} mt-6`}
          />
        </div>
      )}
    </>
  );
}

/** "Top rated Hindi thriller movies on Netflix" — built from whichever filters are set. */
function browseHeading(
  mediaType: MediaType,
  f: DiscoverFilters,
  genres: { id: number; name: string }[],
  keywordName: string | null,
) {
  const noun = mediaType === "tv" ? "shows" : "movies";
  const mood = moods.find((m) => m.keywordId === f.keyword)?.label ?? keywordName;
  const sort = f.sort && f.sort !== "popular" ? sortOptions.find((s) => s.id === f.sort)?.label : null;
  const lang = languageOptions.find((l) => l.code === f.language)?.label;
  const genre = genres.find((g) => g.id === f.genre)?.name;
  const service = streamingServices.find((s) => s.id === f.provider)?.name;

  // Proper nouns (language, "Indian") keep their case; everything else is lower-cased mid-sentence.
  const lower = (v?: string | null) => v?.toLowerCase();
  const words = [lower(sort), f.originCountry === "IN" ? "Indian" : null, lang, lower(mood), lower(genre), noun]
    .filter(Boolean)
    .join(" ");
  const tail = [service && `on ${service}`, f.year && `from ${f.year}`].filter(Boolean).join(" ");
  const text = `${words}${tail ? ` ${tail}` : ""}`;
  return f.sort || f.genre || f.provider || f.keyword || f.language || f.originCountry || f.year
    ? text.charAt(0).toUpperCase() + text.slice(1)
    : mediaType === "tv"
      ? "Shows"
      : "Movies";
}

function BrowseSkeleton() {
  return (
    <>
      <Skeleton className="h-14 w-64" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-full" />
        ))}
      </div>
      <TitleGridSkeleton />
    </>
  );
}
