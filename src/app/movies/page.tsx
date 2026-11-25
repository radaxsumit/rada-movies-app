import type { Metadata } from "next";
import { BrowseView } from "@/components/browse/browse-view";

export const metadata: Metadata = {
  title: "Browse movies",
  description: "Filter movies by genre, mood, language, year and the streaming service they're on in India.",
  alternates: { canonical: "/movies" },
};

export default function MoviesPage({ searchParams }: PageProps<"/movies">) {
  return <BrowseView mediaType="movie" searchParams={searchParams} />;
}
