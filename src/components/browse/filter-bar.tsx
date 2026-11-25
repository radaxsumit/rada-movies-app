"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { XIcon } from "lucide-react";
import { languageOptions, sortOptions, streamingServices } from "@/config/discovery";
import { filtersToSearchParams } from "@/lib/discover-params";
import type { DiscoverFilters } from "@/lib/tmdb/discover";
import { cn } from "@/lib/utils";

const FIRST_YEAR = 1950;

/** Browse filters. Every change is a URL change, so filtered views are shareable and back-button friendly. */
export function FilterBar({
  filters,
  genres,
  keywordName,
}: {
  filters: DiscoverFilters;
  genres: { id: number; name: string }[];
  keywordName: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const lastYear = new Date().getFullYear() + 1;

  const apply = (patch: Partial<DiscoverFilters>) => {
    const qs = filtersToSearchParams({ ...filters, ...patch }).toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const num = (v: string) => (v ? Number(v) : undefined);
  const active = filtersToSearchParams(filters).toString().length > 0;

  return (
    <div className={cn("space-y-3 transition-opacity", pending && "opacity-60")} aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Sort" className="flex rounded-full border bg-card/50 p-1">
          {sortOptions.map((s) => {
            const selected = (filters.sort ?? "popular") === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => apply({ sort: s.id })}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                  selected && "bg-primary text-primary-foreground hover:text-primary-foreground",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <Select label="Genre" value={filters.genre} onChange={(v) => apply({ genre: num(v) })}>
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>

        <Select label="Streaming on" value={filters.provider} onChange={(v) => apply({ provider: num(v) })}>
          <option value="">Any service</option>
          {streamingServices.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select label="Language" value={filters.language} onChange={(v) => apply({ language: v || undefined })}>
          <option value="">Any language</option>
          {languageOptions.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </Select>

        <Select label="Year" value={filters.year} onChange={(v) => apply({ year: num(v) })}>
          <option value="">Any year</option>
          {Array.from({ length: lastYear - FIRST_YEAR + 1 }, (_, i) => lastYear - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>

        <label className="flex cursor-pointer items-center gap-2 rounded-full border bg-card/50 px-3.5 py-2 text-sm font-medium has-checked:border-ember/60 has-checked:bg-ember-soft">
          <input
            type="checkbox"
            className="accent-ember"
            checked={filters.originCountry === "IN"}
            onChange={(e) => apply({ originCountry: e.target.checked ? "IN" : undefined })}
          />
          Made in India
        </label>
      </div>

      {(keywordName || active) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {keywordName && (
            <button
              type="button"
              onClick={() => apply({ keyword: undefined })}
              className="flex items-center gap-1.5 rounded-full bg-ember-soft px-3 py-1 font-medium capitalize hover:bg-ember/25"
              aria-label={`Remove mood: ${keywordName}`}
            >
              {keywordName} <XIcon className="size-3.5" />
            </button>
          )}
          {active && (
            <button
              type="button"
              onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 cursor-pointer appearance-none rounded-full border bg-card/50 pr-9 pl-4 text-sm font-medium outline-none hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring",
          value ? "border-ember/60 bg-ember-soft" : "text-muted-foreground",
        )}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs text-muted-foreground"
      >
        ▾
      </span>
    </label>
  );
}
