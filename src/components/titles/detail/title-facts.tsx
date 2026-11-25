import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney, languageName } from "@/lib/format";
import { personHref } from "@/lib/routes";
import { providerLogoUrl } from "@/lib/tmdb/images";
import type { TitleDetail } from "@/lib/tmdb/types";

/** Side panel of facts + mood tags (TMDB keywords). */
export function TitleFacts({ title }: { title: TitleDetail }) {
  const rows: [string, React.ReactNode][] = [];
  if (title.originalTitle !== title.title) rows.push(["Original title", title.originalTitle]);
  if (title.status) rows.push(["Status", title.status]);
  const released = formatDate(title.releaseDate);
  if (released) rows.push([title.mediaType === "tv" ? "First aired" : "Released", released]);
  if (title.numberOfEpisodes) rows.push(["Episodes", title.numberOfEpisodes]);
  const lang = languageName(title.originalLanguage);
  if (lang) rows.push(["Language", lang]);
  if (title.countries.length) rows.push(["Country", title.countries.slice(0, 3).join(", ")]);
  const budget = formatMoney(title.budget);
  if (budget) rows.push(["Budget", budget]);
  const revenue = formatMoney(title.revenue);
  if (revenue) rows.push(["Box office", revenue]);
  if (title.writers.length)
    rows.push([
      "Writing",
      title.writers.map((w, i) => (
        <span key={w.id}>
          {i > 0 && ", "}
          <Link href={personHref(w.id, w.name)} className="hover:text-ember">
            {w.name}
          </Link>
        </span>
      )),
    ]);

  return (
    <section aria-label="Details" className="space-y-5 rounded-2xl border bg-card/50 p-5">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {title.networks.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {title.networks.map((n) => (
            <Image
              key={n.id}
              src={providerLogoUrl(n.logoPath)}
              alt={n.name}
              title={n.name}
              width={92}
              height={32}
              className="h-6 w-auto rounded bg-white/90 object-contain px-1.5 py-1"
            />
          ))}
        </div>
      )}

      {title.keywords.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Vibes</h3>
          {/* Phase 2 links these to mood-based discovery */}
          <ul className="flex flex-wrap gap-1.5">
            {title.keywords.map((k) => (
              <li key={k.id}>
                <Badge variant="outline" className="rounded-full capitalize">
                  {k.name}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
