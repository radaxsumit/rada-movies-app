import Image from "next/image";
import Link from "next/link";
import { UserIcon } from "lucide-react";
import { personHref } from "@/lib/routes";
import { profileUrl } from "@/lib/tmdb/images";
import type { PersonCredit } from "@/lib/tmdb/types";

export function CastRow({ heading = "Cast", people }: { heading?: string; people: PersonCredit[] }) {
  if (people.length === 0) return null;
  return (
    <section aria-label={heading} className="space-y-4">
      <h2 className="text-xl font-semibold sm:text-2xl">{heading}</h2>
      <ul className="hide-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
        {people.map((p) => (
          <li key={`${p.id}-${p.role}`} className="w-28 shrink-0 snap-start sm:w-32">
            <PersonChip person={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PersonChip({ person }: { person: PersonCredit }) {
  const src = profileUrl(person.profilePath);
  return (
    <Link href={personHref(person.id, person.name)} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted ring-1 ring-border transition group-hover:ring-ember/60">
        {src ? (
          <Image
            src={src}
            alt={person.name}
            fill
            sizes="128px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <UserIcon className="absolute inset-0 m-auto size-10 text-muted-foreground" aria-hidden />
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-medium">{person.name}</p>
      {person.role && <p className="line-clamp-1 text-xs text-muted-foreground">{person.role}</p>}
    </Link>
  );
}
