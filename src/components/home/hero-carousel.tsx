"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { InfoIcon, StarIcon } from "lucide-react";
import { TrailerButton } from "@/components/titles/detail/trailer-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { titleHref } from "@/lib/routes";
import { backdropUrl, logoUrl } from "@/lib/tmdb/images";
import type { HeroSlide } from "@/lib/tmdb/featured";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 8000;

/**
 * Cinematic rotating hero: crossfading backdrops, logo art, trailer button.
 * Auto-advances (paused on hover/focus and for reduced-motion users).
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const slide = slides[index];

  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || reduceMotion || slides.length < 2) return;
    const t = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduceMotion, go, slides.length]);

  if (!slide) return null;
  const backdrop = backdropUrl(slide.backdropPath, "original");
  const logo = logoUrl(slide.logoPath);
  const href = titleHref(slide.mediaType, slide.id, slide.title);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Trending now"
      className="relative isolate flex min-h-[88svh] items-end overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 -z-10">
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.9 }, scale: { duration: INTERVAL_MS / 1000, ease: "linear" } }}
          >
            {backdrop && (
              <Image
                src={backdrop}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-top"
              />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent" />
      </div>

      {/* Copy */}
      <div className="container-page pt-24 pb-28 sm:pb-32">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            className="max-w-2xl space-y-5"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            aria-live="polite"
          >
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-ember">#{index + 1} trending today</span>
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
                    priority={index === 0}
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
                  <StarIcon className="size-4 fill-current text-verdict-one-time" />
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
                <Link href={href}>
                  <InfoIcon className="size-4" />
                  More info
                </Link>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide picker */}
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
                className="group/dot relative h-1.5 w-8 overflow-hidden rounded-full bg-foreground/20 transition-all hover:bg-foreground/40 aria-selected:w-14"
              >
                {i === index && (
                  <motion.span
                    key={`${s.id}-${paused}`}
                    className={cn("absolute inset-y-0 left-0 rounded-full bg-ember")}
                    initial={{ width: reduceMotion || paused ? "100%" : "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: reduceMotion || paused ? 0 : INTERVAL_MS / 1000, ease: "linear" }}
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
