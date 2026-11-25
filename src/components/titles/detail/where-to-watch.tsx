import Image from "next/image";
import { ExternalLinkIcon } from "lucide-react";
import { site } from "@/config/site";
import { providerLogoUrl } from "@/lib/tmdb/images";
import type { Provider, WatchProviders } from "@/lib/tmdb/types";

const GROUPS: { key: keyof Omit<WatchProviders, "link">; label: string }[] = [
  { key: "stream", label: "Stream" },
  { key: "free", label: "Free" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
];

/**
 * Legal "where to watch" offers for our region, from TMDB's JustWatch data.
 * Offers link to the JustWatch-powered TMDB page, which deep-links into each service.
 */
export function WhereToWatch({ providers, title }: { providers: WatchProviders | null; title: string }) {
  const groups = GROUPS.map((g) => ({ ...g, items: providers?.[g.key] ?? [] })).filter((g) => g.items.length > 0);

  return (
    <section aria-labelledby="watch-heading" className="space-y-4 rounded-2xl border bg-card/50 p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="watch-heading" className="text-lg font-semibold">
          Where to watch
        </h2>
        <span className="text-xs text-muted-foreground">in {regionName(site.watchRegion)}</span>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {title} isn’t on any streaming service here yet. Check back later.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.key} className="space-y-2">
              <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{g.label}</h3>
              <ul className="flex flex-wrap gap-2">
                {g.items.map((p) => (
                  <ProviderLogo key={p.id} provider={p} href={providers?.link ?? null} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        Availability by JustWatch
        {providers?.link && (
          <a
            href={providers.link}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 hover:text-foreground"
          >
            All offers <ExternalLinkIcon className="size-3" />
          </a>
        )}
      </p>
    </section>
  );
}

function ProviderLogo({ provider, href }: { provider: Provider; href: string | null }) {
  const img = (
    <Image
      src={providerLogoUrl(provider.logoPath)}
      alt={provider.name}
      title={provider.name}
      width={44}
      height={44}
      className="size-11 rounded-xl ring-1 ring-border transition hover:scale-105 hover:ring-ember/60"
    />
  );
  return (
    <li>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" aria-label={`Watch on ${provider.name}`}>
          {img}
        </a>
      ) : (
        img
      )}
    </li>
  );
}

function regionName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
