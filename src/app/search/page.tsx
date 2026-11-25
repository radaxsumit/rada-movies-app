import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { UserIcon } from "lucide-react";
import { TitleCard } from "@/components/titles/title-card";
import { TitleGridSkeleton, titleGridClass } from "@/components/titles/title-grid";
import { Button } from "@/components/ui/button";
import { personHref } from "@/lib/routes";
import { searchMulti } from "@/lib/tmdb/discover";
import { profileUrl } from "@/lib/tmdb/images";

type Props = PageProps<"/search">;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = first((await searchParams).q).trim();
  // Search result pages shouldn't be indexed.
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

export default function SearchPage({ searchParams }: Props) {
  return (
    <div className="container-page pt-28 pb-8">
      <Suspense fallback={<TitleGridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: Pick<Props, "searchParams">) {
  const params = await searchParams;
  const q = first(params.q).trim();
  const page = Math.max(1, Number.parseInt(first(params.page), 10) || 1);

  if (!q) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Search</h1>
        Press <kbd className="rounded border px-1.5">Ctrl K</kbd> or <kbd className="rounded border px-1.5">/</kbd> to
        search movies, shows and people.
      </div>
    );
  }

  const { titles, people, totalPages, totalResults } = await searchMulti(q, page);
  const pageHref = (p: number) => `/search?q=${encodeURIComponent(q)}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm text-muted-foreground">
          {totalResults.toLocaleString("en-IN")} result{totalResults === 1 ? "" : "s"}
        </p>
        <h1 className="font-display text-5xl leading-none tracking-wide">“{q}”</h1>
      </header>

      {people.length > 0 && (
        <section aria-label="People" className="space-y-3">
          <h2 className="text-lg font-semibold">People</h2>
          <ul className="flex flex-wrap gap-3">
            {people.map((p) => {
              const src = profileUrl(p.profilePath);
              return (
                <li key={p.id}>
                  <Link
                    href={personHref(p.id, p.name)}
                    className="flex items-center gap-3 rounded-full border bg-card/50 py-1.5 pr-4 pl-1.5 transition hover:border-ember/60"
                  >
                    <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted">
                      {src ? (
                        <Image src={src} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <UserIcon className="size-5 text-muted-foreground" />
                      )}
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{p.name}</span>
                      <span className="block max-w-56 truncate text-xs text-muted-foreground">{p.knownFor}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {titles.length > 0 ? (
        <section aria-label="Movies and shows">
          <ul className={titleGridClass}>
            {titles.map((t) => (
              <li key={`${t.mediaType}-${t.id}`}>
                <TitleCard title={t} className="w-full sm:w-full" />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        people.length === 0 && (
          <p className="py-16 text-center text-muted-foreground">Nothing found. Try another spelling.</p>
        )
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
          {page > 1 && (
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={pageHref(page - 1)}>← Previous</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="secondary" className="rounded-full">
              <Link href={pageHref(page + 1)}>Next →</Link>
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
