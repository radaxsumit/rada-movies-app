import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/legal/prose";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

/**
 * Plain-language policy describing what the app actually does. It's a starting point written
 * with India's DPDP Act basics in mind — have it reviewed before a public launch.
 */
export default function PrivacyPage() {
  return (
    <Prose title="Privacy policy" updated="25 November 2026">
      <p>
        This explains what {site.name} collects, why, and the choices you have. We only collect what the features need.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account:</strong> your email address (to sign you in), and if you use Google sign-in, your name and
          profile picture from Google.
        </li>
        <li>
          <strong>Profile:</strong> the username, display name and bio you choose.
        </li>
        <li>
          <strong>What you post:</strong> verdicts, reviews, comments, likes, lists, diary entries, watchlist, follows
          and any reports you send. Reviews, comments, public lists, diary entries and follows are public.
        </li>
        <li>
          <strong>Basic usage stats:</strong> anonymous page-view counts (no tracking cookies, no ad profiles).
        </li>
      </ul>
      <p>We don’t sell your data, show ads, or collect payment details.</p>

      <h2>Why we use it</h2>
      <ul>
        <li>To sign you in and show your profile and posts.</li>
        <li>To keep the community safe (moderating reported content, limiting spam).</li>
        <li>To understand which pages are useful so we can improve them.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We only use cookies needed to keep you signed in. Trailers play through YouTube’s privacy-enhanced mode
        (youtube-nocookie.com).
      </p>

      <h2>Where it’s stored and who processes it</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — database and sign-in, hosted in Mumbai, India.
        </li>
        <li>
          <strong>Vercel</strong> — website hosting and anonymous analytics.
        </li>
        <li>
          <strong>TMDB</strong> — movie data. We don’t send them anything about you.
        </li>
      </ul>

      <h2>Your rights</h2>
      <ul>
        <li>
          <strong>Correct</strong> your profile any time in <Link href="/settings/profile">settings</Link>.
        </li>
        <li>
          <strong>Delete</strong> your account and everything you posted from{" "}
          <Link href="/settings/profile">settings</Link> — it’s immediate and permanent.
        </li>
        <li>
          <strong>Access</strong> a copy of your data, or ask any question, by emailing{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
        </li>
      </ul>

      <h2>Grievances</h2>
      <p>
        If you have a complaint about how we handle your data, email{" "}
        <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. We aim to reply within 7 days.
      </p>

      <h2>Children</h2>
      <p>{site.name} is not meant for children under 13, and we don’t knowingly collect their data.</p>

      <h2>Changes</h2>
      <p>If we change this policy in a meaningful way, we’ll update the date above and note it on the site.</p>
    </Prose>
  );
}
