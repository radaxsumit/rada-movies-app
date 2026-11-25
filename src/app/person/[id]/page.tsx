import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UserIcon } from "lucide-react";
import { TitleCard } from "@/components/titles/title-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Age } from "@/components/ui-extra/age";
import { ReadMore } from "@/components/ui-extra/read-more";
import { ageFrom, formatDate } from "@/lib/format";
import { parseIdParam, personHref, slugify, titleHref } from "@/lib/routes";
import { getPopular } from "@/lib/tmdb/client";
import { getMovie, getPerson } from "@/lib/tmdb/details";
import { profileUrl } from "@/lib/tmdb/images";
import type { FilmographyItem } from "@/lib/tmdb/types";

type Props = PageProps<"/person/[id]">;

/** Prebuild the lead cast of the most popular movie, so the route always has a sample param. */
export async function generateStaticParams() {
  const [top] = await getPopular("movie");
  const movie = top ? await getMovie(top.id) : null;
  return (movie?.cast ?? []).slice(0, 3).map((p) => ({ id: `${p.id}-${slugify(p.name)}` }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseIdParam((await params).id);
  const person = id ? await getPerson(id) : null;
  if (!person) return { title: "Person not found" };
  const description = person.biography
    ? `${person.biography.slice(0, 157).trimEnd()}…`
    : `Movies and shows with ${person.name}.`;
  const image = profileUrl(person.profilePath, "h632");
  return {
    title: person.name,
    description,
    alternates: { canonical: personHref(person.id, person.name) },
    openGraph: { title: person.name, description, type: "profile", images: image ? [image] : undefined },
  };
}

export default function PersonPage({ params }: Props) {
  return (
    <Suspense fallback={<PersonSkeleton />}>
      <PersonDetail params={params} />
    </Suspense>
  );
}

async function PersonDetail({ params }: Pick<Props, "params">) {
  const id = parseIdParam((await params).id);
  const person = id ? await getPerson(id) : null;
  if (!person) notFound();

  const photo = profileUrl(person.profilePath, "h632");
  // Age at death is fixed, so compute it here; a living person's age is computed in the browser (<Age>).
  const ageAtDeath = person.birthday && person.deathday ? ageFrom(person.birthday, person.deathday) : null;
  const facts: [string, React.ReactNode][] = [];
  if (person.knownForDepartment) facts.push(["Known for", person.knownForDepartment]);
  if (person.birthday)
    facts.push([
      "Born",
      <>
        {formatDate(person.birthday)}
        {!person.deathday && <Age birthday={person.birthday} />}
      </>,
    ]);
  if (person.deathday)
    facts.push(["Died", `${formatDate(person.deathday)}${ageAtDeath !== null ? ` (aged ${ageAtDeath})` : ""}`]);
  if (person.placeOfBirth) facts.push(["Birthplace", person.placeOfBirth]);

  // Group filmography by department, acting first.
  const byDept = new Map<string, FilmographyItem[]>();
  for (const item of person.filmography) {
    byDept.set(item.department, [...(byDept.get(item.department) ?? []), item]);
  }
  const departments = [...byDept.keys()].sort((a, b) =>
    a === person.knownForDepartment
      ? -1
      : b === person.knownForDepartment
        ? 1
        : byDept.get(b)!.length - byDept.get(a)!.length,
  );

  return (
    <article className="container-page pt-28 pb-8">
      <div className="grid gap-10 md:grid-cols-[minmax(0,280px)_1fr]">
        <aside className="space-y-6">
          <div className="relative mx-auto aspect-[2/3] w-full max-w-[280px] overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
            {photo ? (
              <Image src={photo} alt={person.name} fill priority sizes="280px" className="object-cover" />
            ) : (
              <UserIcon className="absolute inset-0 m-auto size-16 text-muted-foreground" aria-hidden />
            )}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 rounded-2xl border bg-card/50 p-5 text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {(person.imdbId || person.instagramId) && (
            <p className="flex gap-4 text-sm">
              {person.imdbId && (
                <a
                  href={`https://www.imdb.com/name/${person.imdbId}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  IMDb ↗
                </a>
              )}
              {person.instagramId && (
                <a
                  href={`https://www.instagram.com/${person.instagramId}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Instagram ↗
                </a>
              )}
            </p>
          )}
        </aside>

        <div className="min-w-0 space-y-10">
          <header className="space-y-4">
            <h1 className="font-display text-5xl leading-none tracking-wide sm:text-7xl">{person.name}</h1>
            {person.biography ? (
              <ReadMore text={person.biography} />
            ) : (
              <p className="text-muted-foreground">No biography yet.</p>
            )}
          </header>

          {person.knownFor.length > 0 && (
            <section aria-label="Known for" className="space-y-4">
              <h2 className="text-xl font-semibold sm:text-2xl">Known for</h2>
              <ul className="hide-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
                {person.knownFor.map((t) => (
                  <li key={`${t.mediaType}-${t.id}`} className="snap-start">
                    <TitleCard title={t} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {departments.length > 0 && (
            <section aria-label="Filmography" className="space-y-4">
              <h2 className="text-xl font-semibold sm:text-2xl">Filmography</h2>
              <Tabs defaultValue={departments[0]}>
                <TabsList className="flex-wrap">
                  {departments.map((d) => (
                    <TabsTrigger key={d} value={d}>
                      {d} <span className="ml-1 text-muted-foreground">{byDept.get(d)!.length}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {departments.map((d) => (
                  <TabsContent key={d} value={d}>
                    <ul className="divide-y rounded-2xl border bg-card/50">
                      {byDept.get(d)!.map((item, i) => (
                        <li
                          key={`${item.mediaType}-${item.id}-${item.role}-${i}`}
                          className="flex items-baseline gap-4 px-4 py-3 text-sm"
                        >
                          <span className="w-10 shrink-0 text-muted-foreground tabular-nums">
                            {item.date?.slice(0, 4) ?? "—"}
                          </span>
                          <span className="min-w-0">
                            <Link
                              href={titleHref(item.mediaType, item.id, item.title)}
                              className="font-medium hover:text-ember"
                            >
                              {item.title}
                            </Link>
                            {item.mediaType === "tv" && (
                              <span className="ml-1.5 text-xs text-muted-foreground">TV</span>
                            )}
                            {item.role && (
                              <span className="block text-muted-foreground sm:inline sm:before:content-['_·_']">
                                {item.role}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}

function PersonSkeleton() {
  return (
    <div
      className="container-page grid gap-10 pt-28 md:grid-cols-[minmax(0,280px)_1fr]"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="aspect-[2/3] w-full max-w-[280px] rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-14 w-72 max-w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
