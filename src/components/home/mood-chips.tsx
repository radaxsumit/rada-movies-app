import Link from "next/link";
import { moods } from "@/config/discovery";

/** "What are you in the mood for?" shortcuts into keyword-filtered browse. */
export function MoodChips() {
  return (
    <section aria-labelledby="moods-heading" className="container-page space-y-4">
      <h2 id="moods-heading" className="text-xl font-semibold sm:text-2xl">
        What’s the mood?
      </h2>
      <ul className="flex flex-wrap gap-2">
        {moods.map((m) => (
          <li key={m.keywordId}>
            <Link
              href={`/movies?keyword=${m.keywordId}`}
              className="flex items-center gap-2 rounded-full border bg-card/60 px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:border-ember/60 hover:bg-ember-soft"
            >
              <span aria-hidden>{m.emoji}</span>
              {m.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
