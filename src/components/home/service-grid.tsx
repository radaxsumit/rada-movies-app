import Link from "next/link";
import { streamingServices } from "@/config/discovery";

/** Jump straight to what's streaming on a service in India. */
export function ServiceGrid() {
  return (
    <section aria-labelledby="services-heading" className="container-page space-y-4">
      <h2 id="services-heading" className="text-xl font-semibold sm:text-2xl">
        Browse by streaming service
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {streamingServices.map((s) => (
          <li key={s.id}>
            <Link
              href={`/movies?provider=${s.id}`}
              className="flex h-20 items-center justify-center rounded-2xl border bg-gradient-to-br from-card to-secondary/60 px-4 text-center font-display text-2xl tracking-wide transition hover:-translate-y-0.5 hover:border-ember/60"
            >
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
