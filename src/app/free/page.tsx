import type { Metadata } from "next";
import { Suspense } from "react";
import { ScaleIcon } from "lucide-react";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { TitleCard } from "@/components/titles/title-card";
import { TitleCarousel } from "@/components/titles/title-carousel";
import { TitleGridSkeleton, titleGridClass } from "@/components/titles/title-grid";
import { TitleRowSkeleton } from "@/components/titles/title-row";
import { getFreeCatalogue, toFreeCard } from "@/lib/free";
import { discover } from "@/lib/tmdb/discover";

export const metadata: Metadata = {
  title: "Watch free",
  description:
    "Classic films you can watch in full, free and legally: public-domain cinema and films their makers chose to share.",
  alternates: { canonical: "/free" },
};

export default function FreePage() {
  return (
    <>
      <Suspense fallback={<div className="min-h-[88svh]" />}>
        <FreeHero />
      </Suspense>

      <div className="relative z-10 mt-2 space-y-14">
        <section aria-labelledby="free-all" className="container-page space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-wider text-verdict-must uppercase">Free · No sign-up</p>
              <h2 id="free-all" className="text-xl font-semibold sm:text-2xl">
                Watch right here
              </h2>
            </div>
          </div>
          <Suspense fallback={<TitleGridSkeleton count={12} />}>
            <FreeGrid />
          </Suspense>
        </section>

        <Suspense fallback={<TitleRowSkeleton heading="Free with ads on other services" />}>
          <FreeElsewhere />
        </Suspense>

        <section className="container-page">
          <div className="flex gap-4 rounded-2xl border bg-card/50 p-5 text-sm text-muted-foreground">
            <ScaleIcon className="mt-0.5 size-5 shrink-0 text-ember" aria-hidden />
            <p>
              Every film you can play on this page is in the public domain in India and the US, or was released for free
              by its makers. Films stream from their official homes (Internet Archive or the rights holder’s YouTube
              channel), and we check the rights of each one before adding it.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}

async function FreeHero() {
  const catalogue = await getFreeCatalogue();
  const slides = catalogue
    .filter((t) => t.featured && t.detail.backdropPath)
    .slice(0, 6)
    .map((t) => ({
      id: t.detail.id,
      mediaType: t.detail.mediaType,
      title: t.detail.title,
      overview: t.detail.overview,
      year: t.detail.year,
      genres: t.detail.genres.slice(0, 3),
      rating: t.detail.rating,
      backdropPath: t.detail.backdropPath,
      logoPath: t.detail.logoPath,
      trailer: t.detail.trailer,
      certification: t.detail.certification,
      watchHref: t.href,
    }));
  if (slides.length === 0) return <div className="h-24" />;
  return <HeroCarousel slides={slides} label="Free to watch" eyebrow="Free to watch · Full movie" />;
}

async function FreeGrid() {
  const catalogue = await getFreeCatalogue();
  if (catalogue.length === 0) {
    return <p className="py-10 text-center text-muted-foreground">No free films yet — check back soon.</p>;
  }
  return (
    <ul className={titleGridClass}>
      {catalogue.map((t, i) => (
        <li key={t.id}>
          <TitleCard title={toFreeCard(t)} className="w-full sm:w-full" priority={i < 6} />
        </li>
      ))}
    </ul>
  );
}

async function FreeElsewhere() {
  const { results } = await discover("movie", { freeOnly: true });
  return <TitleCarousel heading="Free with ads on other services" eyebrow="Streaming free in India" titles={results} />;
}
