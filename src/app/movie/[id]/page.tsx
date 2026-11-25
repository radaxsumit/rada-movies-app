import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TitleDetailSkeleton, TitleDetailView } from "@/components/titles/detail/title-detail-view";
import { getPopular } from "@/lib/tmdb/client";
import { getMovie } from "@/lib/tmdb/details";
import { titleMetadata } from "@/lib/metadata";
import { getFreeOffer } from "@/lib/free";
import { parseIdParam, slugify, watchHref } from "@/lib/routes";

/** Prebuild today's most popular movies; every other movie renders on first visit, then is cached. */
export async function generateStaticParams() {
  const popular = await getPopular("movie");
  return popular.slice(0, 10).map((m) => ({ id: `${m.id}-${slugify(m.title)}` }));
}

export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  const id = parseIdParam((await params).id);
  const movie = id ? await getMovie(id) : null;
  return movie ? titleMetadata(movie) : { title: "Movie not found" };
}

export default function MoviePage({ params }: PageProps<"/movie/[id]">) {
  return (
    <Suspense fallback={<TitleDetailSkeleton />}>
      <MovieDetail params={params} />
    </Suspense>
  );
}

async function MovieDetail({ params }: Pick<PageProps<"/movie/[id]">, "params">) {
  const id = parseIdParam((await params).id);
  const [movie, free] = id ? await Promise.all([getMovie(id), getFreeOffer("movie", id)]) : [null, null];
  if (!movie) notFound();
  return <TitleDetailView title={movie} watchHref={free ? watchHref("movie", movie.id, movie.title) : undefined} />;
}
