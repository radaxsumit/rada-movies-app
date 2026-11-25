"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockIcon, MessageCircleIcon } from "lucide-react";
import { useViewer } from "@/components/auth/viewer-provider";
import { Button } from "@/components/ui/button";
import type { Review } from "@/lib/reviews";
import { AuthorChip, LikeButton, ReviewBody, TimeAgo, VerdictBadge } from "./review-bits";

/** Reviews shown to visitors before asking them to join (the rest stay blurred). */
const FREE_PREVIEW = 3;

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const { viewer, loading } = useViewer();
  const pathname = usePathname();
  const gated = !loading && !viewer && reviews.length > FREE_PREVIEW;
  const visible = gated ? reviews.slice(0, FREE_PREVIEW) : reviews;

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {visible.map((r) => (
          <li key={r.id}>
            <ReviewCard review={r} />
          </li>
        ))}
      </ul>

      {gated && (
        <div className="relative overflow-hidden rounded-2xl border bg-card/50 p-6">
          {/* A blurred hint of what's behind the gate */}
          <div className="pointer-events-none space-y-3 opacity-40 blur-sm select-none" aria-hidden>
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40 text-center">
            <LockIcon className="size-5 text-ember" aria-hidden />
            <p className="max-w-sm text-sm">
              <span className="font-semibold">{reviews.length - FREE_PREVIEW} more reviews.</span> Join free to read
              them all and add your own verdict.
            </p>
            <Button asChild className="rounded-full">
              <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`}>Sign in to read more</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReviewCard({ review, showTitleLink }: { review: Review; showTitleLink?: React.ReactNode }) {
  return (
    <article className="space-y-3 rounded-2xl border bg-card/50 p-5">
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
        <VerdictBadge verdict={review.verdict} />
      </header>

      {showTitleLink}

      {review.body && <ReviewBody body={review.body} hasSpoilers={review.hasSpoilers} />}

      <footer className="flex items-center gap-2">
        <LikeButton reviewId={review.id} count={review.likeCount} />
        <Link
          href={`/review/${review.id}`}
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <MessageCircleIcon className="size-4" />
          <span className="tabular-nums">{review.commentCount}</span>
          <span className="sr-only">comments</span>
        </Link>
        <Link href={`/review/${review.id}`} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
          Open review →
        </Link>
      </footer>
    </article>
  );
}
