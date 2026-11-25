import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RepeatIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfileByUsername } from "@/lib/reviews";
import { titleHref } from "@/lib/routes";
import { getDiary } from "@/lib/social";
import { posterUrl } from "@/lib/tmdb/images";
import { getTitleCards } from "@/lib/tmdb/lookup";

type Props = PageProps<"/u/[username]/diary">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}'s film diary`, alternates: { canonical: `/u/${username}/diary` } };
}

export default function DiaryPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
      <Diary params={params} />
    </Suspense>
  );
}

const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

async function Diary({ params }: Pick<Props, "params">) {
  const profile = await getProfileByUsername((await params).username);
  if (!profile) notFound();
  const entries = await getDiary(profile.id);
  if (entries.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
        No diary entries yet. Log a watch from any movie page with{" "}
        <span className="text-foreground">⋯ → Log a watch</span>.
      </p>
    );
  }

  const titles = await getTitleCards(entries.map((e) => ({ mediaType: e.mediaType, tmdbId: e.tmdbId })));
  const titleFor = (id: number, type: string) => titles.find((t) => t.id === id && t.mediaType === type);

  // Group by month, newest first (entries already arrive sorted).
  const months = new Map<string, typeof entries>();
  for (const e of entries) {
    const key = e.watchedOn.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), e]);
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        {entries.length} watch{entries.length === 1 ? "" : "es"} logged
      </p>
      {[...months].map(([month, list]) => (
        <section key={month} aria-label={month} className="space-y-3">
          <h2 className="font-display text-2xl tracking-wide text-ember">
            {monthFmt.format(new Date(`${month}-01T00:00:00Z`))}
          </h2>
          <ol className="divide-y rounded-2xl border bg-card/50">
            {list.map((e) => {
              const t = titleFor(e.tmdbId, e.mediaType);
              if (!t) return null;
              return (
                <li key={e.id} className="flex items-center gap-4 px-4 py-3">
                  <span className="w-8 text-center font-display text-2xl leading-none tabular-nums">
                    {Number(e.watchedOn.slice(8, 10))}
                  </span>
                  <Link
                    href={titleHref(t.mediaType, t.id, t.title)}
                    className="flex min-w-0 flex-1 items-center gap-3 hover:text-ember"
                  >
                    <span className="relative aspect-[2/3] w-9 shrink-0 overflow-hidden rounded bg-muted">
                      <Image src={posterUrl(t.posterPath, "w185")} alt="" fill sizes="36px" className="object-cover" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t.title}</span>
                      <span className="text-xs text-muted-foreground">{t.year}</span>
                    </span>
                  </Link>
                  {e.rewatch && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Rewatch">
                      <RepeatIcon className="size-3.5" /> Rewatch
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
