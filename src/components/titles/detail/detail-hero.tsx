import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRuntime } from "@/lib/format";
import { personHref } from "@/lib/routes";
import { backdropUrl, logoUrl, posterUrl } from "@/lib/tmdb/images";
import type { TitleDetail } from "@/lib/tmdb/types";
import { TitleActions } from "@/components/reviews/title-actions";
import { TrailerButton } from "./trailer-button";

export function DetailHero({ title }: { title: TitleDetail }) {
  const backdrop = backdropUrl(title.backdropPath, "original");
  const logo = logoUrl(title.logoPath);
  const meta = [
    title.mediaType === "tv" ? "Show" : "Movie",
    title.year,
    title.mediaType === "tv" && title.numberOfSeasons
      ? `${title.numberOfSeasons} season${title.numberOfSeasons > 1 ? "s" : ""}`
      : formatRuntime(title.runtimeMinutes),
  ].filter(Boolean);

  return (
    <section className="relative isolate overflow-hidden pt-16">
      <div className="absolute inset-0 -z-10">
        {backdrop && (
          <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover object-top opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </div>

      <div className="container-page grid gap-8 pt-16 pb-10 md:grid-cols-[minmax(0,260px)_1fr] md:items-end md:pt-32">
        <div className="relative mx-auto hidden aspect-[2/3] w-full max-w-[260px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border md:block">
          <Image
            src={posterUrl(title.posterPath, "w500")}
            alt={`${title.title} poster`}
            fill
            priority
            sizes="260px"
            className="object-cover"
          />
        </div>

        <div className="max-w-3xl space-y-5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {meta.map((m, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden>•</span>}
                {m}
              </span>
            ))}
            {title.certification && (
              <Badge variant="outline" className="ml-1 rounded-md">
                {title.certification}
              </Badge>
            )}
          </p>

          {logo ? (
            <h1>
              <span className="sr-only">{title.title}</span>
              {/* Logo art reads better than plain text, as on cinema posters. */}
              <Image
                src={logo}
                alt=""
                width={500}
                height={200}
                priority
                className="h-auto max-h-36 w-auto max-w-[min(100%,420px)] object-contain object-left drop-shadow-2xl"
              />
            </h1>
          ) : (
            <h1 className="font-display text-5xl leading-none tracking-wide sm:text-7xl">{title.title}</h1>
          )}

          {title.tagline && <p className="text-lg text-muted-foreground italic">“{title.tagline}”</p>}

          <div className="flex flex-wrap items-center gap-2">
            {title.rating !== null && (
              <span className="mr-2 flex items-center gap-1.5 text-sm">
                <StarIcon className="size-4 fill-current text-verdict-one-time" />
                <span className="font-semibold">{title.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">TMDB · {title.voteCount.toLocaleString("en-IN")} votes</span>
              </span>
            )}
            {title.genres.map((g) => (
              <Badge key={g.id} variant="secondary" className="rounded-full">
                {g.name}
              </Badge>
            ))}
          </div>

          <p className="max-w-2xl leading-relaxed text-foreground/90">{title.overview || "No overview yet."}</p>

          {title.leads.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">{title.mediaType === "tv" ? "Created by " : "Directed by "}</span>
              {title.leads.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && ", "}
                  <Link href={personHref(p.id, p.name)} className="font-medium hover:text-ember">
                    {p.name}
                  </Link>
                </span>
              ))}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            {title.trailer && <TrailerButton trailer={title.trailer} title={title.title} />}
            <TitleActions mediaType={title.mediaType} tmdbId={title.id} title={title.title} />
          </div>
        </div>
      </div>
    </section>
  );
}
