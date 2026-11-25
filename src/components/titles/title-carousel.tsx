"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { TitleCard as TitleCardData } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";
import { TitleCard } from "./title-card";

/**
 * Smooth, draggable row of title cards (Embla). Arrow buttons appear on hover for mouse users;
 * touch users swipe. Falls back gracefully: without JS it is still a horizontally scrollable list.
 */
export function TitleCarousel({
  heading,
  titles,
  seeAllHref,
  eyebrow,
  priority = false,
}: {
  heading: string;
  titles: TitleCardData[];
  seeAllHref?: string;
  eyebrow?: string;
  priority?: boolean;
}) {
  const [viewportRef, embla] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
    slidesToScroll: "auto",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    // Read the initial arrow state on the next frame (Embla has measured by then).
    const frame = requestAnimationFrame(update);
    embla.on("select", update).on("reInit", update).on("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      embla.off("select", update).off("reInit", update).off("scroll", update);
    };
  }, [embla, update]);

  if (titles.length === 0) return null;

  return (
    <section aria-label={heading} className="group/row space-y-4">
      <div className="container-page flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="text-xs font-medium tracking-wider text-ember uppercase">{eyebrow}</p>}
          <h2 className="text-xl font-semibold sm:text-2xl">{heading}</h2>
        </div>
        {seeAllHref && (
          <Link href={seeAllHref} className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
            See all →
          </Link>
        )}
      </div>

      <div className="relative">
        <div ref={viewportRef} className="overflow-hidden">
          <ul className="container-page flex gap-4 pb-2">
            {titles.map((title, i) => (
              <li key={`${title.mediaType}-${title.id}`} className="shrink-0">
                <TitleCard title={title} priority={priority && i < 5} />
              </li>
            ))}
          </ul>
        </div>

        <ArrowButton direction="prev" disabled={!canPrev} onClick={() => embla?.scrollPrev()} />
        <ArrowButton direction="next" disabled={!canNext} onClick={() => embla?.scrollNext()} />
      </div>
    </section>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Scroll left" : "Scroll right"}
      className={cn(
        "absolute top-[calc(50%-1.5rem)] z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border bg-background/80 opacity-0 shadow-lg backdrop-blur transition group-hover/row:opacity-100 hover:bg-background focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-0 pointer-fine:flex",
        direction === "prev" ? "left-2 lg:left-4" : "right-2 lg:right-4",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
