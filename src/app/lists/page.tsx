import type { Metadata } from "next";
import { Suspense } from "react";
import { NewListButton } from "@/components/social/list-editor";
import { ListCard, listGridClass } from "@/components/social/list-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecentLists } from "@/lib/social";

export const metadata: Metadata = {
  title: "Lists",
  description: "Hand-picked movie and show lists from the community.",
  alternates: { canonical: "/lists" },
};

export default function ListsPage() {
  return (
    <div className="container-page space-y-8 pt-28 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-5xl leading-none tracking-wide sm:text-6xl">Lists</h1>
          <p className="text-muted-foreground">Curated picks from people who watch a lot of movies.</p>
        </div>
        <NewListButton />
      </header>
      <Suspense fallback={<ListGridSkeleton />}>
        <RecentLists />
      </Suspense>
    </div>
  );
}

async function RecentLists() {
  const lists = await getRecentLists();
  if (lists.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
        No lists yet. Make the first one — open any movie and choose{" "}
        <span className="text-foreground">⋯ → Add to a list</span>.
      </p>
    );
  }
  return (
    <ul className={listGridClass}>
      {lists.map((l) => (
        <li key={l.id}>
          <ListCard list={l} />
        </li>
      ))}
    </ul>
  );
}

function ListGridSkeleton() {
  return (
    <div className={listGridClass}>
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-56 rounded-2xl" />
      ))}
    </div>
  );
}
