import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/legal/prose";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Terms of use", alternates: { canonical: "/terms" } };

/** Community rules + basic terms. A starting point — have it reviewed before a public launch. */
export default function TermsPage() {
  return (
    <Prose title="Terms of use" updated="25 November 2026">
      <p>By using {site.name} you agree to these terms. They’re short, so please read them.</p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 13 years old.</li>
        <li>Keep your email account secure — sign-in links are sent there.</li>
        <li>
          You can delete your account any time in <Link href="/settings/profile">settings</Link>.
        </li>
      </ul>

      <h2>What you post</h2>
      <p>
        You own your reviews and comments. By posting them you let us show them on {site.name} (including on your public
        profile and in other people’s feeds). If you delete them, we stop showing them.
      </p>

      <h2>Community rules</h2>
      <ul>
        <li>Review the film, not the person. No harassment, hate speech or threats.</li>
        <li>Mark spoilers. Unmarked spoilers may be removed.</li>
        <li>No spam, ads, or links to pirated copies of films.</li>
        <li>Don’t impersonate anyone or post other people’s private information.</li>
      </ul>
      <p>
        Anyone can report a review or comment. Moderators may remove content that breaks these rules and may suspend
        accounts that repeatedly do.
      </p>

      <h2>Movie information</h2>
      <p>
        Film details come from TMDB and streaming availability from JustWatch; they can be incomplete or out of date. We
        don’t host or stream films — links send you to the official services.
      </p>

      <h2>No warranty</h2>
      <p>
        {site.name} is provided as is. We do our best to keep it running and accurate, but can’t guarantee it will
        always be available or error-free.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or complaints: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. See also our{" "}
        <Link href="/privacy">privacy policy</Link>.
      </p>
    </Prose>
  );
}
