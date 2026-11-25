import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListCard, listGridClass } from "@/components/social/list-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfileByUsername } from "@/lib/reviews";
import { getPublicLists } from "@/lib/social";

type Props = PageProps<"/u/[username]/lists">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}'s lists`, alternates: { canonical: `/u/${username}/lists` } };
}

export default function UserListsPage({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
      <Lists params={params} />
    </Suspense>
  );
}

/** Public lists only; owners see their private lists in the "Add to a list" dialog and via direct links. */
async function Lists({ params }: Pick<Props, "params">) {
  const profile = await getProfileByUsername((await params).username);
  if (!profile) notFound();
  const lists = await getPublicLists(profile.id);
  if (lists.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No public lists yet.</p>
    );
  }
  return (
    <ul className={listGridClass}>
      {lists.map((l) => (
        <li key={l.id}>
          <ListCard list={l} showOwner={false} />
        </li>
      ))}
    </ul>
  );
}
