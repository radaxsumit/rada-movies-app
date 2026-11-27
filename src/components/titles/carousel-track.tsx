"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Draggable scroller (Embla) with arrow buttons for mouse users; touch users swipe.
 * Receives server-rendered <li> items as children, so the cards themselves never hydrate.
 */
export function CarouselTrack({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="relative">
      <div ref={viewportRef} className="overflow-hidden">
        <ul className="container-page flex gap-4 pb-2">{children}</ul>
      </div>
      <ArrowButton direction="prev" disabled={!canPrev} onClick={() => embla?.scrollPrev()} />
      <ArrowButton direction="next" disabled={!canNext} onClick={() => embla?.scrollNext()} />
    </div>
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
