import { MessageSquareQuoteIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getTitleReviews } from "@/lib/reviews";
import type { MediaType } from "@/lib/tmdb/types";
import { ReviewList } from "./review-list";

/** Community reviews on a title page. Cached per title; refreshed when someone posts. */
export async function ReviewsSection({ mediaType, tmdbId }: { mediaType: MediaType; tmdbId: number }) {
  const reviews = await getTitleReviews(mediaType, tmdbId);

  return (
    <section aria-labelledby="reviews-heading" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="reviews-heading" className="text-xl font-semibold sm:text-2xl">
          Reviews
        </h2>
        {reviews.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {reviews.length}
            {reviews.length === 30 ? "+" : ""} so far
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center">
          <MessageSquareQuoteIcon className="size-6 text-muted-foreground" aria-hidden />
          <p className="font-medium">No reviews yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Seen it? Tap <span className="font-medium text-foreground">Give your verdict</span> above and be the first.
          </p>
        </div>
      ) : (
        <ReviewList reviews={reviews} />
      )}
    </section>
  );
}

export function ReviewsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
    </div>
  );
}
