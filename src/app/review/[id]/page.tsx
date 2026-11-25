import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommentThread } from "@/components/reviews/comment-thread";
import { ReportButton } from "@/components/reviews/report-button";
import { AuthorChip, LikeButton, ReviewBody, TimeAgo, VerdictBadge } from "@/components/reviews/review-bits";
import { Skeleton } from "@/components/ui/skeleton";
import { getVerdict } from "@/config/verdicts";
import { getReview, getReviewComments } from "@/lib/reviews";
import { titleHref } from "@/lib/routes";
import { posterUrl } from "@/lib/tmdb/images";
import { getTitleCard } from "@/lib/tmdb/lookup";

type Props = PageProps<"/review/[id]">;

/** Needed by Cache Components for validation; real reviews render on first visit, then cache. */
export async function generateStaticParams() {
  return [{ id: "00000000-0000-0000-0000-000000000000" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const review = await getReview((await params).id);
  if (!review) return { title: "Review not found" };
  const title = await getTitleCard(review.mediaType, review.tmdbId);
  const who = review.author.displayName || review.author.username;
  const name = `${who} on ${title?.title ?? "a title"}: ${getVerdict(review.verdict).label}`;
  return {
    title: name,
    description: review.hasSpoilers ? "Contains spoilers." : (review.body?.slice(0, 160) ?? undefined),
    alternates: { canonical: `/review/${review.id}` },
  };
}

export default function ReviewPage({ params }: Props) {
  return (
    <div className="container-page max-w-3xl pt-28 pb-10">
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <ReviewDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ReviewDetail({ params }: Pick<Props, "params">) {
  const { id } = await params;
  const review = await getReview(id);
  if (!review) notFound();
  const [title, comments] = await Promise.all([getTitleCard(review.mediaType, review.tmdbId), getReviewComments(id)]);

  return (
    <article className="space-y-8">
      {title && (
        <Link
          href={titleHref(title.mediaType, title.id, title.title)}
          className="group flex items-center gap-4 rounded-2xl border bg-card/50 p-3 transition hover:border-ember/60"
        >
          <span className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={posterUrl(title.posterPath, "w185")} alt="" fill sizes="56px" className="object-cover" />
          </span>
          <span>
            <span className="block text-xs text-muted-foreground">Review of</span>
            <span className="block font-display text-3xl leading-none tracking-wide group-hover:text-ember">
              {title.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {title.mediaType === "tv" ? "Show" : "Movie"}
              {title.year && ` · ${title.year}`}
            </span>
          </span>
        </Link>
      )}

      <section className="space-y-4 rounded-2xl border bg-card/50 p-6">
        <header className="flex items-start justify-between gap-3">
          <AuthorChip
            author={review.author}
            meta={
              <>
                {" · "}
                <TimeAgo date={review.createdAt} />
              </>
            }
          />
          <VerdictBadge verdict={review.verdict} size="lg" />
        </header>
        {review.body ? (
          <ReviewBody body={review.body} hasSpoilers={review.hasSpoilers} clamp={false} />
        ) : (
          <p className="text-muted-foreground italic">Verdict only — no written review.</p>
        )}
        <div className="flex items-center gap-2">
          <LikeButton reviewId={review.id} count={review.likeCount} />
          <ReportButton target={{ reviewId: review.id }} authorId={review.author.id} className="ml-auto" />
        </div>
      </section>

      <CommentThread reviewId={review.id} comments={comments} />
    </article>
  );
}
