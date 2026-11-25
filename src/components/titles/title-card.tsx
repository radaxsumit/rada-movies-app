import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "lucide-react";
import { titleHref } from "@/lib/routes";
import { posterUrl } from "@/lib/tmdb/images";
import type { TitleCard as TitleCardData } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

export function TitleCard({
  title,
  className,
  priority,
}: {
  title: TitleCardData;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={titleHref(title.mediaType, title.id, title.title)}
      className={cn("group block w-36 shrink-0 sm:w-44", className)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted ring-1 ring-border transition duration-300 group-hover:-translate-y-1 group-hover:ring-ember/60">
        <Image
          src={posterUrl(title.posterPath)}
          alt={title.title}
          fill
          sizes="(min-width: 640px) 176px, 144px"
          priority={priority}
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {title.rating !== null && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold backdrop-blur">
            <StarIcon className="size-3 fill-current text-verdict-one-time" />
            {title.rating.toFixed(1)}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-medium">{title.title}</p>
      <p className="text-xs text-muted-foreground">
        {title.mediaType === "tv" ? "Show" : "Movie"}
        {title.year && ` · ${title.year}`}
      </p>
    </Link>
  );
}
