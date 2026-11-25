import { Skeleton } from "@/components/ui/skeleton";
import type { TitleCard as TitleCardData } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";
import { TitleCard } from "./title-card";

/**
 * Horizontal scrolling row. Phase 2 swaps the native scroller for an Embla
 * carousel with arrow buttons and hover-expand cards.
 */
export function TitleRow({
  heading,
  titles,
  contained = true,
}: {
  heading: string;
  titles: TitleCardData[];
  /** false when the row already sits inside a padded column. */
  contained?: boolean;
}) {
  return (
    <section aria-label={heading} className="space-y-4">
      <h2 className={cn("text-xl font-semibold sm:text-2xl", contained && "container-page")}>{heading}</h2>
      {/* scroll-px matches the padding so snapping doesn't hide the first card's left inset */}
      <ul
        className={cn(
          "hide-scrollbar flex snap-x gap-4 overflow-x-auto pb-2",
          contained && "container-page scroll-px-4 sm:scroll-px-6 lg:scroll-px-10",
        )}
      >
        {titles.map((title, i) => (
          <li key={`${title.mediaType}-${title.id}`} className="snap-start">
            <TitleCard title={title} priority={i < 4} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TitleRowSkeleton({ heading }: { heading: string }) {
  return (
    <section aria-label={heading} className="space-y-4">
      <h2 className="container-page text-xl font-semibold sm:text-2xl">{heading}</h2>
      <div className="container-page flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="w-36 shrink-0 space-y-2 sm:w-44">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </section>
  );
}
