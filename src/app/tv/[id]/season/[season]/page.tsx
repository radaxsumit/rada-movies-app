import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatRuntime } from "@/lib/format";
import { parseIdParam, seasonHref, slugify, titleHref } from "@/lib/routes";
import { getPopular } from "@/lib/tmdb/client";
import { getTv, getTvSeason } from "@/lib/tmdb/details";
import { posterUrl, stillUrl } from "@/lib/tmdb/images";

type Props = PageProps<"/tv/[id]/season/[season]">;

export async function generateStaticParams() {
  const popular = await getPopular("tv");
  return popular.slice(0, 3).map((t) => ({ id: `${t.id}-${slugify(t.title)}`, season: "1" }));
}

async function load(params: Props["params"]) {
  const { id: rawId, season: rawSeason } = await params;
  const id = parseIdParam(rawId);
  const seasonNumber = /^\d{1,3}$/.test(rawSeason) ? Number(rawSeason) : null;
  if (!id || seasonNumber === null) return null;
  const [show, season] = await Promise.all([getTv(id), getTvSeason(id, seasonNumber)]);
  return show && season ? { show, season } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Season not found" };
  return {
    title: `${data.show.title} — ${data.season.name}`,
    description: data.season.overview || `Episodes of ${data.show.title}, ${data.season.name}.`,
    alternates: { canonical: seasonHref(data.show.id, data.show.title, data.season.seasonNumber) },
  };
}

export default function SeasonPage({ params }: Props) {
  return (
    <Suspense fallback={<SeasonSkeleton />}>
      <SeasonDetail params={params} />
    </Suspense>
  );
}

async function SeasonDetail({ params }: Pick<Props, "params">) {
  const data = await load(params);
  if (!data) notFound();
  const { show, season } = data;

  const seasonNumbers = show.seasons.map((s) => s.seasonNumber);
  const index = seasonNumbers.indexOf(season.seasonNumber);
  const prev = index > 0 ? show.seasons[index - 1] : null;
  const next = index >= 0 && index < show.seasons.length - 1 ? show.seasons[index + 1] : null;

  return (
    <article className="container-page pt-28 pb-8">
      <Link href={titleHref("tv", show.id, show.title)} className="text-sm text-muted-foreground hover:text-foreground">
        ← {show.title}
      </Link>

      <header className="mt-4 flex gap-5">
        <div className="relative hidden aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border sm:block">
          <Image
            src={posterUrl(season.posterPath ?? show.posterPath, "w342")}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-5xl leading-none tracking-wide">{season.name}</h1>
          <p className="text-sm text-muted-foreground">
            {[season.airYear, `${season.episodes.length} episodes`].filter(Boolean).join(" · ")}
          </p>
          {season.overview && <p className="max-w-2xl text-foreground/90">{season.overview}</p>}
        </div>
      </header>

      {/* Season switcher */}
      {show.seasons.length > 1 && (
        <nav aria-label="Seasons" className="mt-6 hide-scrollbar flex gap-2 overflow-x-auto">
          {show.seasons.map((s) => (
            <Link
              key={s.seasonNumber}
              href={seasonHref(show.id, show.title, s.seasonNumber)}
              aria-current={s.seasonNumber === season.seasonNumber ? "page" : undefined}
              className="shrink-0 rounded-full border px-3 py-1 text-sm text-muted-foreground transition hover:text-foreground aria-[current=page]:border-ember aria-[current=page]:bg-ember-soft aria-[current=page]:text-foreground"
            >
              {s.seasonNumber === 0 ? "Specials" : `S${s.seasonNumber}`}
            </Link>
          ))}
        </nav>
      )}

      <ol className="mt-8 space-y-4">
        {season.episodes.map((e) => {
          const still = stillUrl(e.stillPath);
          return (
            <li key={e.id} className="flex flex-col gap-4 rounded-2xl border bg-card/50 p-3 sm:flex-row">
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-64">
                {still && (
                  <Image src={still} alt="" fill sizes="(min-width: 640px) 256px, 100vw" className="object-cover" />
                )}
                <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-semibold backdrop-blur">
                  E{e.episodeNumber}
                </span>
              </div>
              <div className="min-w-0 space-y-1.5 py-1">
                <h2 className="font-semibold">{e.name}</h2>
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {[formatDate(e.airDate), formatRuntime(e.runtimeMinutes)].filter(Boolean).join(" · ")}
                  {e.rating !== null && (
                    <span className="flex items-center gap-1">
                      <StarIcon className="size-3 fill-current text-verdict-one-time" />
                      {e.rating.toFixed(1)}
                    </span>
                  )}
                </p>
                <p className="line-clamp-3 text-sm text-foreground/85">{e.overview || "No synopsis yet."}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <nav aria-label="Season navigation" className="mt-8 flex justify-between gap-4 text-sm">
        {prev ? (
          <Link
            href={seasonHref(show.id, show.title, prev.seasonNumber)}
            className="flex items-center gap-1 hover:text-ember"
          >
            <ChevronLeftIcon className="size-4" /> {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={seasonHref(show.id, show.title, next.seasonNumber)}
            className="flex items-center gap-1 hover:text-ember"
          >
            {next.name} <ChevronRightIcon className="size-4" />
          </Link>
        )}
      </nav>
    </article>
  );
}

function SeasonSkeleton() {
  return (
    <div className="container-page space-y-4 pt-28" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-12 w-64" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}
