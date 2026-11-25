import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReviewCard } from "@/components/reviews/review-list";
import { Skeleton } from "@/components/ui/skeleton";
import { verdicts } from "@/config/verdicts";
import { getProfileByUsername, getUserReviews } from "@/lib/reviews";
import { titleHref } from "@/lib/routes";
import { posterUrl } from "@/lib/tmdb/images";
import { getTitleCards } from "@/lib/tmdb/lookup";
import { cn } from "@/lib/utils";

type Props = PageProps<"/u/[username]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfileByUsername((await params).username);
  if (!profile) return { title: "Profile not found" };
  const name = profile.displayName || profile.username;
  return {
    title: `${name} (@${profile.username})`,
    description: profile.bio ?? `${name}'s verdicts and reviews.`,
    alternates: { canonical: `/u/${profile.username}` },
  };
}

export default function ProfilePage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: Pick<Props, "params">) {
  const profile = await getProfileByUsername((await params).username);
  if (!profile) notFound();
  const reviews = await getUserReviews(profile.id);
  const titles = await getTitleCards(reviews.map((r) => ({ mediaType: r.mediaType, tmdbId: r.tmdbId })));
  const titleFor = (r: (typeof reviews)[number]) =>
    titles.find((t) => t.id === r.tmdbId && t.mediaType === r.mediaType);

  const name = profile.displayName || profile.username;
  const counts = Object.fromEntries(verdicts.map((v) => [v.id, reviews.filter((r) => r.verdict === v.id).length]));

  return (
    <div className="space-y-10">
      <section aria-label="Verdict stats" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Verdicts" value={reviews.length} />
        {verdicts.map((v) => (
          <Stat key={v.id} label={v.label} value={counts[v.id] ?? 0} dotClass={v.bgClass} />
        ))}
      </section>

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          {name} hasn’t given any verdicts yet.
        </p>
      ) : (
        <section aria-label="Reviews" className="space-y-4">
          <h2 className="text-xl font-semibold">Recent verdicts</h2>
          <ul className="space-y-4">
            {reviews.map((r) => {
              const t = titleFor(r);
              return (
                <li key={r.id}>
                  <ReviewCard
                    review={r}
                    showTitleLink={
                      t && (
                        <Link
                          href={titleHref(t.mediaType, t.id, t.title)}
                          className="flex items-center gap-3 rounded-xl bg-background/40 p-2 hover:bg-background/70"
                        >
                          <span className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={posterUrl(t.posterPath, "w185")}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </span>
                          <span className="text-sm">
                            <span className="block font-semibold">{t.title}</span>
                            <span className="text-xs text-muted-foreground">{t.year}</span>
                          </span>
                        </Link>
                      )
                    }
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, dotClass }: { label: string; value: number; dotClass?: string }) {
  return (
    <div className="rounded-2xl border bg-card/50 p-4">
      <p className="font-display text-4xl leading-none">{value}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {dotClass && <span className={cn("size-1.5 rounded-full", dotClass)} />}
        {label}
      </p>
    </div>
  );
}
