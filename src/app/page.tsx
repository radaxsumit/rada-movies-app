import { Suspense } from "react";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { MoodChips } from "@/components/home/mood-chips";
import { ServiceGrid } from "@/components/home/service-grid";
import { TitleCarousel } from "@/components/titles/title-carousel";
import { TitleRowSkeleton } from "@/components/titles/title-row";
import { Skeleton } from "@/components/ui/skeleton";
import { streamingServices } from "@/config/discovery";
import type { DiscoverFilters } from "@/lib/tmdb/discover";
import { discover, getTopRated, getUpcomingMovies } from "@/lib/tmdb/discover";
import { getTrending } from "@/lib/tmdb/client";
import { getHeroSlides } from "@/lib/tmdb/featured";
import type { MediaType, TitleCard } from "@/lib/tmdb/types";

const service = (slug: string) => streamingServices.find((s) => s.slug === slug)!;

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>

      <div className="relative z-10 mt-2 space-y-14">
        <Row heading="Trending today" eyebrow="Hot right now" load={() => getTrending("day")} priority />
        <MoodChips />
        <DiscoverRow
          heading="Popular Indian movies"
          mediaType="movie"
          filters={{ originCountry: "IN" }}
          seeAllHref="/movies?origin=IN"
        />
        <DiscoverRow
          heading="Top shows on Netflix"
          eyebrow="Streaming in India"
          mediaType="tv"
          filters={{ provider: service("netflix").id }}
          seeAllHref={`/tv?provider=${service("netflix").id}`}
        />
        <DiscoverRow
          heading="Top movies on Prime Video"
          eyebrow="Streaming in India"
          mediaType="movie"
          filters={{ provider: service("prime-video").id }}
          seeAllHref={`/movies?provider=${service("prime-video").id}`}
        />
        <DiscoverRow
          heading="Top movies on JioHotstar"
          eyebrow="Streaming in India"
          mediaType="movie"
          filters={{ provider: service("jiohotstar").id }}
          seeAllHref={`/movies?provider=${service("jiohotstar").id}`}
        />
        <Row heading="Coming soon to cinemas" eyebrow="In theatres" load={getUpcomingMovies} />
        <ServiceGrid />
        <Row
          heading="All-time greats"
          eyebrow="Top rated"
          load={() => getTopRated("movie")}
          seeAllHref="/movies?sort=top"
        />
      </div>
    </>
  );
}

async function Hero() {
  const slides = await getHeroSlides();
  return <HeroCarousel slides={slides} />;
}

/** A carousel row that streams in independently, so one slow request never blocks the page. */
function Row(props: {
  heading: string;
  eyebrow?: string;
  seeAllHref?: string;
  priority?: boolean;
  load: () => Promise<TitleCard[]>;
}) {
  return (
    <Suspense fallback={<TitleRowSkeleton heading={props.heading} />}>
      <RowContent {...props} />
    </Suspense>
  );
}

async function RowContent({ load, ...rest }: Parameters<typeof Row>[0]) {
  const titles = await load();
  return <TitleCarousel {...rest} titles={titles} />;
}

function DiscoverRow({
  mediaType,
  filters,
  ...rest
}: {
  heading: string;
  eyebrow?: string;
  seeAllHref?: string;
  mediaType: MediaType;
  filters: DiscoverFilters;
}) {
  return <Row {...rest} load={async () => (await discover(mediaType, filters)).results} />;
}

function HeroSkeleton() {
  return (
    <section className="relative flex min-h-[88svh] items-end" aria-busy="true" aria-label="Loading">
      <div className="container-page space-y-5 pb-32">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-28 w-96 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
    </section>
  );
}
