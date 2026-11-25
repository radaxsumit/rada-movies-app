import { verdicts } from "@/config/verdicts";
import { getTitleStats } from "@/lib/supabase/public";
import type { MediaType } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

/** Community verdict breakdown (the four-tier review system), read from Supabase. */
export async function VerdictSummary({ mediaType, tmdbId }: { mediaType: MediaType; tmdbId: number }) {
  const stats = await getTitleStats(mediaType, tmdbId);
  const total = stats.reviewCount;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const recommended = total ? pct(stats.counts.must_watch + stats.counts.masterpiece) : null;

  return (
    <section aria-labelledby="verdict-heading" className="space-y-4 rounded-2xl border bg-card/50 p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="verdict-heading" className="text-lg font-semibold">
          Community verdict
        </h2>
        <span className="text-xs text-muted-foreground">
          {total ? `${total.toLocaleString("en-IN")} review${total > 1 ? "s" : ""}` : "No reviews yet"}
        </span>
      </div>

      {recommended !== null && (
        <p>
          <span className="font-display text-5xl leading-none text-verdict-must">{recommended}%</span>{" "}
          <span className="text-sm text-muted-foreground">say Must watch or better</span>
        </p>
      )}

      {/* Stacked bar */}
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        {total > 0 &&
          verdicts.map((v) => (
            <div key={v.id} className={cn("h-full", v.bgClass)} style={{ width: `${pct(stats.counts[v.id])}%` }} />
          ))}
      </div>

      <ul className="grid grid-cols-2 gap-2 text-sm">
        {verdicts.map((v) => (
          <li key={v.id} className="flex items-center gap-2">
            <span className={cn("size-2 shrink-0 rounded-full", v.bgClass)} />
            <span className="flex-1">{v.label}</span>
            <span className="text-muted-foreground tabular-nums">{total ? `${pct(stats.counts[v.id])}%` : "–"}</span>
          </li>
        ))}
      </ul>

      {total === 0 && (
        <p className="text-sm text-muted-foreground">Be the first to give your verdict — reviews open soon.</p>
      )}
    </section>
  );
}

export function VerdictSummarySkeleton() {
  return <div className="h-56 animate-pulse rounded-2xl border bg-card/50" />;
}
