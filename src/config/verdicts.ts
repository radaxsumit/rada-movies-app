/**
 * Four-tier review verdicts instead of stars. The `id` values match the
 * `verdict` enum in supabase/migrations — change labels freely, ids only with a migration.
 */
export const verdicts = [
  {
    id: "skip",
    label: "Skip",
    hint: "Not worth your time",
    colorClass: "text-verdict-skip",
    bgClass: "bg-verdict-skip",
  },
  {
    id: "one_time",
    label: "One-time watch",
    hint: "Fine for a lazy evening",
    colorClass: "text-verdict-one-time",
    bgClass: "bg-verdict-one-time",
  },
  {
    id: "must_watch",
    label: "Must watch",
    hint: "Go for it",
    colorClass: "text-verdict-must",
    bgClass: "bg-verdict-must",
  },
  {
    id: "masterpiece",
    label: "Masterpiece",
    hint: "All-time great",
    colorClass: "text-verdict-masterpiece",
    bgClass: "bg-verdict-masterpiece",
  },
] as const;

export type VerdictId = (typeof verdicts)[number]["id"];

export function getVerdict(id: VerdictId) {
  return verdicts.find((v) => v.id === id)!;
}
