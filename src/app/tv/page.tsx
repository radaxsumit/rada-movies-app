import type { Metadata } from "next";
import { BrowseView } from "@/components/browse/browse-view";

export const metadata: Metadata = {
  title: "Browse shows",
  description: "Filter TV shows by genre, mood, language, year and the streaming service they're on in India.",
  alternates: { canonical: "/tv" },
};

export default function ShowsPage({ searchParams }: PageProps<"/tv">) {
  return <BrowseView mediaType="tv" searchParams={searchParams} />;
}
