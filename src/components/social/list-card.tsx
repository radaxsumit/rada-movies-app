import Image from "next/image";
import Link from "next/link";
import { LockIcon } from "lucide-react";
import type { ListSummary } from "@/lib/social";
import { posterUrl } from "@/lib/tmdb/images";
import { getTitleCards } from "@/lib/tmdb/lookup";

export const listGridClass = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

/** List tile with a fanned stack of the first posters. */
export async function ListCard({ list, showOwner = true }: { list: ListSummary; showOwner?: boolean }) {
  const posters = await getTitleCards(list.preview);
  return (
    <Link
      href={`/lists/${list.id}`}
      className="group block space-y-3 rounded-2xl border bg-card/50 p-4 transition hover:-translate-y-0.5 hover:border-ember/60"
    >
      <div className="relative flex h-36 items-end">
        {posters.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
            Empty list
          </div>
        ) : (
          posters.map((p, i) => (
            <div
              key={`${p.mediaType}-${p.id}`}
              className="relative aspect-[2/3] h-full overflow-hidden rounded-lg shadow-xl ring-1 ring-border transition-transform duration-300 group-hover:translate-x-[calc(var(--i)*6px)]"
              style={{ marginLeft: i === 0 ? 0 : "-2.5rem", zIndex: 10 - i, ["--i" as string]: i }}
            >
              <Image src={posterUrl(p.posterPath, "w185")} alt="" fill sizes="96px" className="object-cover" />
            </div>
          ))
        )}
      </div>
      <div>
        <p className="flex items-center gap-1.5 font-semibold group-hover:text-ember">
          {!list.isPublic && <LockIcon className="size-3.5 text-muted-foreground" aria-label="Private" />}
          <span className="truncate">{list.title}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {list.itemCount} title{list.itemCount === 1 ? "" : "s"}
          {showOwner && ` · by @${list.owner.username}`}
        </p>
      </div>
    </Link>
  );
}
