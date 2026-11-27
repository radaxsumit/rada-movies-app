"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { InfoIcon, StarIcon } from "lucide-react";
import { TrailerButton } from "@/components/titles/detail/trailer-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { titleHref } from "@/lib/routes";
import { backdropUrl, logoUrl } from "@/lib/tmdb/images";
import type { HeroSlide } from "@/lib/tmdb/featured";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 8000;

/** prefers-reduced-motion, read without an animation library. */
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * Cinematic rotating hero: crossfading backdrops, logo art, trailer button.
 * Auto-advances (paused on hover/focus and for reduced-motion users). Animations are plain CSS
 * (tw-animate-css), and only the current and previous backdrops are mounted.
 */
export function HeroCarousel({
  slides,
  label = "Trending now",
  eyebrow,
}: {
  slides: HeroSlide[];
  label?: string;
  /** Text above each title. Defaults to "#1 trending today", "#2 …". */
  eyebrow?: string;
}) {
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const slide = slides[index];

  const go = useCallback(
    (next: number) => {
      setIndex((current) => {
        const target = (next + slides.length) % slides.length;
        if (target !== current) setPrevious(current);
        return target;
      });
    },
    [slides.length],
  );

  useEffect(() => {
    if (paused || reduceMotion || slides.length < 2) return;
    const t = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduceMotion, go, slides.length]);

  if (!slide) return null;
  const logo = logoUrl(slide.logoPath);
  const href = titleHref(slide.mediaType, slide.id, slide.title);
  const prevSlide = previous !== null ? slides[previous] : null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="relative isolate flex min-h-[88svh] items-end overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Backdrop: previous slide underneath, current fades in on top */}
      <div className="absolute inset-0 -z-10">
        {prevSlide && prevSlide.id !== slide.id && <Backdrop key={`prev-${prevSlide.id}`} slide={prevSlide} />}
        <Backdrop
          key={slide.id}
          slide={slide}
          // The very first backdrop is the page's largest image: fetch it first.
          eager={index === 0 && previous === null}
          className={previous !== null ? "animate-in duration-1000 fade-in motion-reduce:animate-none" : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent" />
      </div>

      {/* Copy */}
      <div className="container-page pt-24 pb-28 sm:pb-32">
        <div
          key={slide.id}
          className={cn(
            "max-w-2xl space-y-5",
            previous !== null && "animate-in duration-500 fade-in slide-in-from-bottom-3 motion-reduce:animate-none",
          )}
          aria-live="polite"
        >
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-ember">{eyebrow ?? `#${index + 1} trending today`}</span>
            <span aria-hidden>•</span>
            <span>{slide.mediaType === "tv" ? "Show" : "Movie"}</span>
            {slide.year && (
              <>
                <span aria-hidden>•</span>
                <span>{slide.year}</span>
              </>
            )}
            {slide.certification && (
              <Badge variant="outline" className="rounded-md">
                {slide.certification}
              </Badge>
            )}
          </p>

          <h2>
            {logo ? (
              <>
                <span className="sr-only">{slide.title}</span>
                <Image
                  src={logo}
                  alt=""
                  width={500}
                  height={200}
                  sizes="(min-width: 640px) 440px, 80vw"
                  className="h-auto max-h-40 w-auto max-w-[min(100%,440px)] object-contain object-left drop-shadow-2xl"
                />
              </>
            ) : (
              <span className="font-display text-6xl leading-none tracking-wide sm:text-8xl">{slide.title}</span>
            )}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {slide.rating !== null && (
              <span className="mr-1 flex items-center gap-1 text-sm font-semibold">
                <StarIcon className="size-4 fill-current text-verdict-one-time" aria-hidden />
                <span className="sr-only">Rating</span>
                {slide.rating.toFixed(1)}
              </span>
            )}
            {slide.genres.map((g) => (
              <Badge key={g.id} variant="secondary" className="rounded-full">
                {g.name}
              </Badge>
            ))}
          </div>

          <p className="line-clamp-3 max-w-xl text-base leading-relaxed text-foreground/90 sm:text-lg">
            {slide.overview}
          </p>

          <div className="flex flex-wrap gap-3">
            {slide.trailer && <TrailerButton trailer={slide.trailer} title={slide.title} />}
            <Button asChild size="lg" variant="secondary" className="gap-2 rounded-full">
              <Link href={href} aria-label={`View details for ${slide.title}`}>
                <InfoIcon className="size-4" aria-hidden />
                View details
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Slide picker with a CSS progress bar */}
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-8 sm:bottom-10">
          <div className="container-page flex items-center gap-2" role="tablist" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${i + 1}. ${s.title}`}
                onClick={() => go(i)}
                className="relative h-1.5 w-8 overflow-hidden rounded-full bg-foreground/20 transition-[width,background-color] hover:bg-foreground/40 aria-selected:w-14"
              >
                {i === index && (
                  <span
                    // Restart the bar whenever the slide changes or play resumes.
                    key={`${s.id}-${paused}`}
                    className="absolute inset-0 origin-left rounded-full bg-ember"
                    style={
                      paused || reduceMotion
                        ? undefined
                        : { animation: `hero-progress ${INTERVAL_MS}ms linear forwards` }
                    }
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Backdrop({ slide, eager, className }: { slide: HeroSlide; eager?: boolean; className?: string }) {
  // w1280 is plenty under the dark gradients, and far lighter than the original upload.
  const src = backdropUrl(slide.backdropPath, "w1280");
  if (!src) return null;
  return (
    <div className={cn("absolute inset-0", className)}>
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        preload={eager}
        fetchPriority={eager ? "high" : "auto"}
        className="object-cover object-top"
      />
    </div>
  );
}
