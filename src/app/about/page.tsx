import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/legal/prose";
import { site } from "@/config/site";
import { verdicts } from "@/config/verdicts";

export const metadata: Metadata = {
  title: "About",
  description: `What ${site.name} is and how the four-verdict reviews work.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Prose title={`About ${site.shortName}`}>
      <p>
        {site.name} helps you decide what to watch next. Browse movies and shows, see which streaming service has them
        in India, watch trailers, and read honest verdicts from people who’ve actually seen them.
      </p>
      <h2>Four verdicts, no stars</h2>
      <p>Star ratings blur together. Here every review starts with one clear call:</p>
      <ul>
        {verdicts.map((v) => (
          <li key={v.id}>
            <strong>{v.label}</strong> — {v.hint.toLowerCase()}
          </li>
        ))}
      </ul>
      <p>Add a written review if you like, mark spoilers, and keep lists, a watch diary and a watchlist.</p>
      <h2>Where the data comes from</h2>
      <p>
        Movie and show information comes from{" "}
        <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">
          TMDB
        </a>
        . This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability is provided by
        JustWatch. We don’t host or stream films — “where to watch” links take you to the official services.
      </p>
      <p>
        Questions? Read our <Link href="/privacy">privacy policy</Link> and <Link href="/terms">terms</Link>, or email{" "}
        <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
      </p>
    </Prose>
  );
}
