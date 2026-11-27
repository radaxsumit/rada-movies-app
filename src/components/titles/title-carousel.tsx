import Link from "next/link";
import type { TitleCard as TitleCardData } from "@/lib/tmdb/types";
import { CarouselTrack } from "./carousel-track";
import { TitleCard } from "./title-card";

/** Enough to fill two screens; "See all" covers the rest and keeps the page light. */
const MAX_ITEMS = 16;

/**
 * Row of title cards. The cards are rendered on the server (no client JavaScript per card);
 * only the scrolling behaviour in <CarouselTrack> runs in the browser.
 */
export function TitleCarousel({
  heading,
  titles,
  seeAllHref,
  eyebrow,
}: {
  heading: string;
  titles: TitleCardData[];
  seeAllHref?: string;
  eyebrow?: string;
}) {
  if (titles.length === 0) return null;

  return (
    <section aria-label={heading} className="group/row space-y-4">
      <div className="container-page flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="text-xs font-medium tracking-wider text-ember uppercase">{eyebrow}</p>}
          <h2 className="text-xl font-semibold sm:text-2xl">{heading}</h2>
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            aria-label={`See all: ${heading}`}
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
            See all →
          </Link>
        )}
      </div>

      <CarouselTrack>
        {titles.slice(0, MAX_ITEMS).map((title) => (
          <li key={`${title.mediaType}-${title.id}`} className="shrink-0">
            <TitleCard title={title} />
          </li>
        ))}
      </CarouselTrack>
    </section>
  );
}
