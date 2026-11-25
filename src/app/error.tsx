"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Catches errors thrown while rendering a page (e.g. TMDB is down). The header and footer stay visible. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // Phase 5 sends this to Sentry.
    console.error(error);
  }, [error]);

  return (
    <section className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-6 pt-16 text-center">
      <p className="font-display text-7xl tracking-wide text-ember">Intermission</p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Something went wrong on our side</h1>
        <p className="max-w-md text-muted-foreground">
          We couldn’t load this page. It’s usually temporary — try again in a moment.
        </p>
        {error.digest && <p className="text-xs text-muted-foreground">Error reference: {error.digest}</p>}
      </div>
      <div className="flex gap-3">
        <Button size="lg" className="rounded-full" onClick={() => retry()}>
          Try again
        </Button>
        <Button asChild size="lg" variant="secondary" className="rounded-full">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </section>
  );
}
