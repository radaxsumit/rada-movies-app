import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarCheckIcon, ListIcon, RepeatIcon, UsersIcon } from "lucide-react";
import { AuthorChip, ReviewBody, TimeAgo, VerdictBadge } from "@/components/reviews/review-bits";
import { FollowButton } from "@/components/social/profile-bits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireViewer } from "@/lib/auth";
import { getFeed, getFollowingIds, getSuggestedPeople, type FeedItem } from "@/lib/feed";
import { formatDate } from "@/lib/format";
import { titleHref } from "@/lib/routes";
import { posterUrl } from "@/lib/tmdb/images";
import { getTitleCards } from "@/lib/tmdb/lookup";
import type { TitleCard } from "@/lib/tmdb/types";

export const metadata: Metadata = { title: "Your feed", robots: { index: false } };

export default function FeedPage() {
  return (
    <div className="container-page max-w-3xl space-y-8 pt-28 pb-10">
      <header className="space-y-2">
        <h1 className="font-display text-5xl leading-none tracking-wide">Friends’ activity</h1>
        <p className="text-muted-foreground">What the people you follow are watching and saying.</p>
      </header>
      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
    </div>
  );
}

async function Feed() {
  const viewer = await requireViewer("/feed");
  const items = await getFeed(viewer.id);

  if (items.length === 0) {
    const following = await getFollowingIds(viewer.id);
    const suggestions = await getSuggestedPeople([viewer.id, ...following]);
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
          <UsersIcon className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">{following.length ? "It’s quiet in here" : "Follow people to fill your feed"}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {following.length
              ? "The people you follow haven’t posted anything yet."
              : "When people you follow give verdicts, log watches or make lists, it shows up here."}
          </p>
        </div>
        {suggestions.length > 0 && (
          <section aria-label="Suggested people" className="space-y-3">
            <h2 className="text-lg font-semibold">People reviewing lately</h2>
            <ul className="divide-y rounded-2xl border bg-card/50">
              {suggestions.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <AuthorChip author={p} />
                  <FollowButton userId={p.id} username={p.username} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/movies">Find something to review</Link>
        </Button>
      </div>
    );
  }

  const refs = items.flatMap((i) => (i.kind === "list" ? [] : [{ mediaType: i.mediaType, tmdbId: i.tmdbId }]));
  const titles = await getTitleCards(refs);
  const titleFor = (i: FeedItem) =>
    i.kind === "list" ? undefined : titles.find((t) => t.id === i.tmdbId && t.mediaType === i.mediaType);

  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`}>
          <FeedCard item={item} title={titleFor(item)} />
        </li>
      ))}
    </ol>
  );
}

function FeedCard({ item, title }: { item: FeedItem; title?: TitleCard }) {
  const action =
    item.kind === "review"
      ? "gave a verdict"
      : item.kind === "watch"
        ? item.rewatch
          ? "rewatched"
          : "watched"
        : "made a list";

  return (
    <article className="space-y-3 rounded-2xl border bg-card/50 p-4">
      <header className="flex items-start justify-between gap-3">
        <AuthorChip
          author={item.author}
          meta={
            <>
              {` ${action} · `}
              <TimeAgo date={item.at} />
            </>
          }
        />
        {item.kind === "review" && <VerdictBadge verdict={item.verdict} />}
        {item.kind === "watch" &&
          (item.rewatch ? (
            <RepeatIcon className="size-4 text-muted-foreground" aria-label="Rewatch" />
          ) : (
            <CalendarCheckIcon className="size-4 text-muted-foreground" aria-hidden />
          ))}
        {item.kind === "list" && <ListIcon className="size-4 text-muted-foreground" aria-hidden />}
      </header>

      {title && (
        <Link
          href={titleHref(title.mediaType, title.id, title.title)}
          className="flex items-center gap-3 rounded-xl bg-background/40 p-2 hover:bg-background/70"
        >
          <span className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image src={posterUrl(title.posterPath, "w185")} alt="" fill sizes="48px" className="object-cover" />
          </span>
          <span className="text-sm">
            <span className="block font-semibold">{title.title}</span>
            <span className="text-xs text-muted-foreground">
              {item.kind === "watch" ? `Watched ${formatDate(item.watchedOn)}` : title.year}
            </span>
          </span>
        </Link>
      )}

      {item.kind === "review" && item.body && <ReviewBody body={item.body} hasSpoilers={item.hasSpoilers} />}
      {item.kind === "review" && (
        <Link href={`/review/${item.id}`} className="block text-xs text-muted-foreground hover:text-foreground">
          Open review →
        </Link>
      )}

      {item.kind === "list" && (
        <Link href={`/lists/${item.id}`} className="block rounded-xl bg-background/40 p-3 hover:bg-background/70">
          <span className="block font-semibold">{item.title}</span>
          <span className="text-xs text-muted-foreground">
            {item.itemCount} title{item.itemCount === 1 ? "" : "s"}
          </span>
        </Link>
      )}
    </article>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-36 rounded-2xl" />
      ))}
    </div>
  );
}
