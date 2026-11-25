import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TitleRow } from "@/components/titles/title-row";
import { seasonHref } from "@/lib/routes";
import { posterUrl } from "@/lib/tmdb/images";
import type { TitleDetail } from "@/lib/tmdb/types";
import { CastRow } from "./cast-row";
import { DetailHero } from "./detail-hero";
import { TitleFacts } from "./title-facts";
import { VerdictSummary, VerdictSummarySkeleton } from "./verdict-summary";
import { WhereToWatch } from "./where-to-watch";

/** Shared layout for movie and show pages. */
export function TitleDetailView({ title }: { title: TitleDetail }) {
  return (
    <article>
      <DetailHero title={title} />

      <div className="container-page grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-12">
          <CastRow heading={title.mediaType === "tv" ? "Series cast" : "Cast"} people={title.cast} />
          {title.mediaType === "tv" && <SeasonGrid title={title} />}
          {title.recommendations.length > 0 && (
            <TitleRow heading="More like this" titles={title.recommendations} contained={false} />
          )}
        </div>

        <aside className="space-y-6">
          <WhereToWatch providers={title.providers} title={title.title} />
          <Suspense fallback={<VerdictSummarySkeleton />}>
            <VerdictSummary mediaType={title.mediaType} tmdbId={title.id} />
          </Suspense>
          <TitleFacts title={title} />
        </aside>
      </div>
    </article>
  );
}

function SeasonGrid({ title }: { title: TitleDetail }) {
  if (title.seasons.length === 0) return null;
  return (
    <section aria-label="Seasons" className="space-y-4">
      <h2 className="text-xl font-semibold sm:text-2xl">Seasons</h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {title.seasons.map((s) => (
          <li key={s.seasonNumber}>
            <Link
              href={seasonHref(title.id, title.title, s.seasonNumber)}
              className="group flex gap-3 rounded-xl border bg-card/50 p-2 transition hover:border-ember/60"
            >
              <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={posterUrl(s.posterPath ?? title.posterPath, "w185")}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 py-1">
                <p className="line-clamp-1 font-medium group-hover:text-ember">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[s.airYear, `${s.episodeCount} episode${s.episodeCount > 1 ? "s" : ""}`].filter(Boolean).join(" · ")}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Shown while a title page streams in. Matches the hero + sidebar layout to avoid layout shift. */
export function TitleDetailSkeleton() {
  return (
    <div className="pt-16" aria-busy="true" aria-label="Loading">
      <div className="container-page grid gap-8 pt-16 pb-10 md:grid-cols-[minmax(0,260px)_1fr] md:items-end md:pt-32">
        <Skeleton className="hidden aspect-[2/3] w-full max-w-[260px] rounded-2xl md:block" />
        <div className="space-y-5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-80 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-36 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
