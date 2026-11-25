import { Logo } from "@/components/brand/logo";
import { site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t">
      <div className="container-page flex flex-col gap-6 py-10 text-sm text-muted-foreground md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p>{site.tagline}</p>
        </div>
        {/* TMDB requires this attribution: https://www.themoviedb.org/api-terms-of-use */}
        <p className="max-w-md md:text-right">
          Movie and show data from{" "}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability by
          JustWatch.
        </p>
      </div>
    </footer>
  );
}
