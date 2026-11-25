import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalLinkIcon, InfoIcon, ShieldCheckIcon } from "lucide-react";
import { ReviewsSection, ReviewsSkeleton } from "@/components/reviews/reviews-section";
import { TitleActions } from "@/components/reviews/title-actions";
import { TitleCarousel } from "@/components/titles/title-carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { embedUrl, getFreeCatalogue, getFreeTitle, sourceLabel, sourcePageUrl, toFreeCard } from "@/lib/free";
import { formatRuntime } from "@/lib/format";
import { parseWatchParam, titleHref, watchHref } from "@/lib/routes";

type Props = PageProps<"/watch/[id]">;

/** Prebuild the featured free films; any other free film renders on first visit, then caches. */
export async function generateStaticParams() {
  const catalogue = await getFreeCatalogue();
  const ids = catalogue
    .filter((t) => t.featured)
    .map((t) => ({ id: watchHref(t.mediaType, t.tmdbId, t.detail.title).replace("/watch/", "") }));
  // Cache Components needs at least one param to validate the route.
  return ids.length ? ids : [{ id: "0" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parsed = parseWatchParam((await params).id);
  const free = parsed ? await getFreeTitle(parsed.mediaType, parsed.id) : null;
  if (!free) return { title: "Not available" };
  const name = free.detail.year ? `${free.detail.title} (${free.detail.year})` : free.detail.title;
  return {
    title: `Watch ${name} free`,
    description: `Watch ${free.detail.title} in full, free and legally. ${free.license}.`,
    alternates: { canonical: free.href },
  };
}

export default function WatchPage({ params }: Props) {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <Player params={params} />
    </Suspense>
  );
}

async function Player({ params }: Pick<Props, "params">) {
  const parsed = parseWatchParam((await params).id);
  const free = parsed ? await getFreeTitle(parsed.mediaType, parsed.id) : null;
  if (!free) notFound();
  const { detail } = free;
  const more = (await getFreeCatalogue()).filter((t) => t.id !== free.id).map(toFreeCard);

  return (
    <article className="pt-16">
      {/* Theatre: the player sits on near-black with the backdrop as a soft glow */}
      <div className="bg-black">
        <div className="mx-auto w-full max-w-[min(100%,calc((100svh-4rem)*16/9))]">
          <div className="relative aspect-video w-full">
            <iframe
              src={embedUrl(free.source, free.sourceId)}
              title={`${detail.title} — full movie`}
              className="absolute inset-0 size-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </div>

      <div className="container-page grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-10">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge className="rounded-full bg-verdict-must text-background">Free</Badge>
              <span>Movie</span>
              {detail.year && <span>· {detail.year}</span>}
              {detail.runtimeMinutes && <span>· {formatRuntime(detail.runtimeMinutes)}</span>}
              {detail.genres.slice(0, 3).map((g) => (
                <Badge key={g.id} variant="secondary" className="rounded-full">
                  {g.name}
                </Badge>
              ))}
            </div>
            <h1 className="font-display text-5xl leading-none tracking-wide sm:text-6xl">{detail.title}</h1>
            <p className="max-w-3xl leading-relaxed text-foreground/90">{detail.overview}</p>
            <div className="flex flex-wrap gap-3">
              <TitleActions mediaType={detail.mediaType} tmdbId={detail.id} title={detail.title} />
              <Button asChild size="lg" variant="ghost" className="gap-2 rounded-full">
                <Link href={titleHref(detail.mediaType, detail.id, detail.title)}>
                  <InfoIcon className="size-4" /> Cast & details
                </Link>
              </Button>
            </div>
          </header>

          <Suspense fallback={<ReviewsSkeleton />}>
            <ReviewsSection mediaType={detail.mediaType} tmdbId={detail.id} />
          </Suspense>
        </div>

        <aside className="space-y-6">
          <section aria-label="Rights" className="space-y-3 rounded-2xl border bg-card/50 p-5 text-sm">
            <h2 className="flex items-center gap-2 font-semibold">
              <ShieldCheckIcon className="size-4 text-verdict-must" aria-hidden /> Free & legal to watch
            </h2>
            <p className="text-muted-foreground">
              {free.licenseUrl ? (
                <a href={free.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  {free.license}
                </a>
              ) : (
                free.license
              )}
              . Streaming from {sourceLabel(free.source)}.
            </p>
            <a
              href={sourcePageUrl(free.source, free.sourceId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              View the original <ExternalLinkIcon className="size-3" />
            </a>
            <p className="text-xs text-muted-foreground">
              Old films can have soft picture and sound. Try full screen and the player’s quality menu.
            </p>
          </section>
        </aside>
      </div>

      {more.length > 0 && (
        <TitleCarousel heading="More free films" eyebrow="Watch free" titles={more} seeAllHref="/free" />
      )}
    </article>
  );
}

function PlayerSkeleton() {
  return (
    <div className="pt-16" aria-busy="true" aria-label="Loading player">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="container-page space-y-4 py-8">
        <Skeleton className="h-12 w-80 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
    </div>
  );
}
