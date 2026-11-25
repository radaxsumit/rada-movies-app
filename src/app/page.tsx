import Image from "next/image";
import { Suspense } from "react";
import { TitleRow, TitleRowSkeleton } from "@/components/titles/title-row";
import { site } from "@/config/site";
import { verdicts } from "@/config/verdicts";
import { getPopular, getTrending } from "@/lib/tmdb/client";
import { backdropUrl } from "@/lib/tmdb/images";

/**
 * Phase 0 home: proves the pipeline (server-only TMDB → cached → rendered).
 * Phase 2 replaces this with the full landing page (rotating trailer hero, Embla rows, mood tags).
 */
export default function HomePage() {
  return (
    <>
      <Suspense fallback={<HeroShell />}>
        <Hero />
      </Suspense>

      <div className="relative z-10 -mt-24 space-y-12">
        <Suspense fallback={<TitleRowSkeleton heading="Trending today" />}>
          <TrendingRow />
        </Suspense>
        <Suspense fallback={<TitleRowSkeleton heading="Popular movies" />}>
          <PopularRow />
        </Suspense>
      </div>
    </>
  );
}

async function Hero() {
  const trending = await getTrending("day");
  const feature = trending.find((t) => t.backdropPath) ?? null;
  const image = backdropUrl(feature?.backdropPath, "original");

  return (
    <HeroShell
      background={
        image && <Image src={image} alt="" fill priority sizes="100vw" className="object-cover object-top opacity-60" />
      }
    >
      {feature && (
        <p className="text-sm text-muted-foreground">
          Trending now: <span className="font-medium text-foreground">{feature.title}</span>
        </p>
      )}
    </HeroShell>
  );
}

function HeroShell({ background, children }: { background?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden pt-16">
      <div className="absolute inset-0 -z-10">
        {background}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent" />
      </div>

      <div className="container-page pb-36">
        <h1 className="max-w-3xl font-display text-6xl leading-[0.9] tracking-wide sm:text-8xl">
          Find your next <span className="text-ember">favourite</span> film.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">{site.description}</p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Review verdicts">
          {verdicts.map((v) => (
            <li key={v.id} className="rounded-full border bg-background/50 px-3 py-1 text-sm backdrop-blur">
              <span className={`mr-1.5 inline-block size-2 rounded-full ${v.bgClass}`} />
              {v.label}
            </li>
          ))}
        </ul>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

async function TrendingRow() {
  const titles = await getTrending("day");
  return <TitleRow heading="Trending today" titles={titles} />;
}

async function PopularRow() {
  const titles = await getPopular("movie");
  return <TitleRow heading="Popular movies" titles={titles} />;
}
