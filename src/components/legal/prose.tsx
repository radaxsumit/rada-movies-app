/** Readable long-form layout for About / Privacy / Terms. */
export function Prose({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="container-page max-w-3xl space-y-6 pt-28 pb-16">
      <header className="space-y-2">
        <h1 className="font-display text-5xl leading-none tracking-wide sm:text-6xl">{title}</h1>
        {updated && <p className="text-sm text-muted-foreground">Last updated {updated}</p>}
      </header>
      <div className="space-y-5 leading-relaxed text-foreground/90 [&_a]:text-ember [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </article>
  );
}
