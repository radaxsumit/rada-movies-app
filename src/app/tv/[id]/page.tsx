import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TitleDetailSkeleton, TitleDetailView } from "@/components/titles/detail/title-detail-view";
import { getPopular } from "@/lib/tmdb/client";
import { getTv } from "@/lib/tmdb/details";
import { titleMetadata } from "@/lib/metadata";
import { parseIdParam, slugify } from "@/lib/routes";

/** Prebuild today's most popular shows; every other show renders on first visit, then is cached. */
export async function generateStaticParams() {
  const popular = await getPopular("tv");
  return popular.slice(0, 10).map((t) => ({ id: `${t.id}-${slugify(t.title)}` }));
}

export async function generateMetadata({ params }: PageProps<"/tv/[id]">): Promise<Metadata> {
  const id = parseIdParam((await params).id);
  const show = id ? await getTv(id) : null;
  return show ? titleMetadata(show) : { title: "Show not found" };
}

export default function ShowPage({ params }: PageProps<"/tv/[id]">) {
  return (
    <Suspense fallback={<TitleDetailSkeleton />}>
      <ShowDetail params={params} />
    </Suspense>
  );
}

async function ShowDetail({ params }: Pick<PageProps<"/tv/[id]">, "params">) {
  const id = parseIdParam((await params).id);
  const show = id ? await getTv(id) : null;
  if (!show) notFound();
  return <TitleDetailView title={show} />;
}
